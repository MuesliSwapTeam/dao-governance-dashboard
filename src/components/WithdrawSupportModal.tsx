import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  Box,
  Text,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  useColorModeValue,
  Flex,
  Divider,
  Icon,
  Spinner,
} from "@chakra-ui/react"
import { useState, useEffect } from "react"
import { Proposal } from "../api/model/tally"
import useWalletContext from "../context/wallet"
import ConnectButton from "./ConnectButton"
import {
  GOV_TOKEN_SYMBOL,
  GOV_TOKEN_DECIMALS,
  GOV_TOKEN_POLICY_ID,
  GOV_TOKEN_NAME_HEX,
} from "../cardano/config"
import { useLazyGetStakingPositionsQuery } from "../api/stakingApi"
import { getWalletAddress } from "../cardano/wallet"
import { StakingPosition } from "../api/model/staking"
import { formatNumber, fromNativeAmount } from "../utils/numericHelpers"
import { mintRetractVotePermission } from "../cardano/staking/revoke_vote"
import { CheckCircleIcon } from "@chakra-ui/icons"

interface WithdrawSupportModalProps {
  isOpen: boolean
  onClose: () => void
  proposal: Proposal
  batcherName: string
}

// Calculate voting power for staking position excluding FT tokens (for batcher voting)
const getVotingPowerForBatcherSupport = (funds: any[]): number => {
  const govTokenFunds = funds.filter(
    (x) =>
      x.policy_id === GOV_TOKEN_POLICY_ID &&
      x.asset_name === GOV_TOKEN_NAME_HEX,
  )

  if (govTokenFunds.length === 0) return 0

  const govTokenAmount = govTokenFunds[0]?.amount || "0"
  return Number(fromNativeAmount(govTokenAmount, GOV_TOKEN_DECIMALS))
}

const WithdrawSupportModal: React.FC<WithdrawSupportModalProps> = ({
  isOpen,
  onClose,
  proposal,
  batcherName,
}) => {
  const { isConnected } = useWalletContext()
  const [selectedWithdrawalAmount, setSelectedWithdrawalAmount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [walletAddressHex, setWalletAddressHex] = useState<string | null>(null)
  const [maxWithdrawalAmount, setMaxWithdrawalAmount] = useState<number>(0)
  const [currentSupportAmount, setCurrentSupportAmount] = useState<number>(0)
  const [bestPosition, setBestPosition] = useState<{
    position: StakingPosition
    votingPower: number
    index: number
  } | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const toast = useToast()

  // Color mode values
  const detailBg = useColorModeValue(
    "backgroundSecondary.light",
    "backgroundSecondary.dark",
  )
  const textColor = useColorModeValue("text.light", "text.dark")
  const borderColor = useColorModeValue("gray.200", "gray.600")
  const successColor = useColorModeValue("greens.500.light", "greens.500.dark")

  const [
    fetchStakingPositions,
    { isLoading: isStakingLoading, isUninitialized: isStakingUninitialized },
  ] = useLazyGetStakingPositionsQuery()

  // Fetch wallet address on mount
  useEffect(() => {
    const fetchWalletAddress = async () => {
      try {
        let address = await getWalletAddress()
        setWalletAddressHex((prevAddress) =>
          prevAddress !== address ? address : prevAddress,
        )
      } catch (error) {
        console.error("Failed to fetch wallet address", error)
      }
    }
    if (isConnected) {
      fetchWalletAddress()
    } else {
      setWalletAddressHex(null)
      setSelectedWithdrawalAmount(0)
      setMaxWithdrawalAmount(0)
      setCurrentSupportAmount(0)
      setBestPosition(null)
    }
  }, [isConnected])

  // Fetch staking positions when wallet address is available
  useEffect(() => {
    if (isConnected && walletAddressHex) {
      setSelectedWithdrawalAmount(0)
      setMaxWithdrawalAmount(0)
      setCurrentSupportAmount(0)
      setBestPosition(null)
      setTxHash(null)

      fetchStakingPositions({ wallet: walletAddressHex })
        .then(({ data: resData }) => {
          if (resData == null) return

          const position = resData[0] as StakingPosition

          if (!position) {
            toast({
              title: "No Staking Positions found",
              description: `Before you can withdraw support, you need to stake some ${GOV_TOKEN_SYMBOL} first`,
              status: "error",
              duration: 5000,
              isClosable: true,
            })
            return
          }

          // Calculate total staking power and check for existing participation
          let totalPower = 0
          let currentSupport = 0

          const positionPower = getVotingPowerForBatcherSupport(position.funds)
          totalPower += positionPower

          // Calculate current support for this specific proposal
          let positionSupport = 0

          // Check participations for this proposal
          const participation = position.participations.find(
            (x) => x.proposal_id.toString() === proposal.id.toString(),
          )
          if (participation) {
            positionSupport += Number(
              fromNativeAmount(participation.weight, GOV_TOKEN_DECIMALS),
            )
          }

          let pendingWithdrawal = 0
          // Check delegated actions for this proposal
          const delegatedAction = position.delegated_actions.find(
            (x) =>
              x.participation.proposal_id.toString() === proposal.id.toString(),
          )

          if (delegatedAction && delegatedAction.tag === "retract_vote") {
            pendingWithdrawal += Number(
              fromNativeAmount(
                delegatedAction.participation.weight,
                GOV_TOKEN_DECIMALS,
              ),
            )
          }

          currentSupport += positionSupport - pendingWithdrawal
          totalPower = Math.max(totalPower, currentSupport) // Make sure we have at least the current support amount

          setCurrentSupportAmount(currentSupport)
          setBestPosition({ position, votingPower: totalPower, index: 0 })
          setMaxWithdrawalAmount(currentSupport)

          if (currentSupport === 0) {
            toast({
              title: "No Support to Withdraw",
              description: `You don't have any support for this proposal to withdraw. Please note you might have a pending withdrawal of your support.`,
              status: "info",
              duration: 5000,
              isClosable: true,
            })
          }
        })
        .catch((error) => {
          console.error("Failed to fetch staking positions:", error)
          toast({
            title: "Error loading staking positions",
            description: "Please try refreshing or reconnecting your wallet",
            status: "error",
            duration: 5000,
            isClosable: true,
          })
        })
    }
  }, [walletAddressHex, isConnected, proposal.id])

  const handleWithdrawSupport = async () => {
    if (!isConnected || selectedWithdrawalAmount === 0 || !bestPosition) return

    setIsLoading(true)
    try {
      // Convert withdrawal amount to native units
      const withdrawalAmountNative = Math.floor(
        selectedWithdrawalAmount * Math.pow(10, GOV_TOKEN_DECIMALS),
      ).toString()

      // Find the participation to revoke
      const participation = bestPosition.position.participations.find(
        (x) => x.proposal_id.toString() === proposal.id.toString(),
      )

      if (!participation) {
        throw new Error("No participation found for this proposal")
      }

      // Call the revoke vote function
      await mintRetractVotePermission(
        bestPosition.position.funds.map((x) => {
          return {
            unit: x.policy_id === "" ? "lovelace" : x.policy_id + x.asset_name,
            quantity: Number(x.amount),
          }
        }),
        bestPosition.position.transaction_hash,
        bestPosition.position.output_index.toString(),
        withdrawalAmountNative, // This is the amount to revoke
        proposal.id.toString(),
        participation.end_time,
        participation.proposal_index.toString(),
        bestPosition.position.participations.length > 0
          ? bestPosition.position.participations
          : undefined,
      )

      toast({
        title: "Support Withdrawn!",
        description: `Successfully withdrew ${formatNumber(selectedWithdrawalAmount, GOV_TOKEN_DECIMALS)} ${GOV_TOKEN_SYMBOL} support from ${batcherName}'s license.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      })

      setTxHash("success") // Just set to a string to show success state
    } catch (error) {
      console.error("Failed to withdraw support:", error)
      toast({
        title: "Failed to Withdraw Support",
        description:
          "There was an error withdrawing your support. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedWithdrawalAmount(0)
    setIsLoading(false)
    setTxHash(null)
    onClose()
  }

  const hasSupportToWithdraw = maxWithdrawalAmount > 0

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent bg={detailBg} borderColor={borderColor}>
        <ModalHeader color={textColor} fontSize="xl" fontWeight="semibold">
          {isLoading
            ? "Withdrawing Support"
            : txHash
              ? "Success"
              : "Withdraw Support from Batcher License"}
        </ModalHeader>
        <ModalCloseButton color={textColor} />
        <ModalBody pb={6}>
          {isLoading ? (
            <Box textAlign="center">
              <Spinner size="xl" />
              <Text mt={4}>Withdrawing support, please wait...</Text>
            </Box>
          ) : txHash ? (
            <Box textAlign="center" color={successColor}>
              <Flex justify="center" align="center" gap="1em" mb="1em">
                <Icon as={CheckCircleIcon} w={10} h={10} />
                <Text fontSize="lg">Withdrawal Transaction Successful!</Text>
              </Flex>
              <Text mt={2} mb={4}>
                Successfully withdrew{" "}
                {formatNumber(selectedWithdrawalAmount, GOV_TOKEN_DECIMALS)}{" "}
                {GOV_TOKEN_SYMBOL} support.
              </Text>
            </Box>
          ) : (
            <>
              <Box mb={6}>
                <Text
                  fontWeight="semibold"
                  mb={3}
                  color={textColor}
                  fontSize="lg"
                >
                  {proposal.title}
                </Text>
                <Flex justify="space-between" align="center" mb={4}>
                  <Text fontSize="sm" color="gray.500">
                    <Text as="span" fontWeight="medium">
                      Batcher:
                    </Text>{" "}
                    {batcherName}
                  </Text>
                </Flex>

                <Divider />
              </Box>

              {!isConnected ? (
                <Box textAlign="center" py={6}>
                  <Text mb={4} color={textColor}>
                    Connect your wallet to withdraw support from this batcher
                    license
                  </Text>
                  <ConnectButton />
                </Box>
              ) : !hasSupportToWithdraw ? (
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>No support to withdraw!</AlertTitle>
                    <AlertDescription>
                      You don't have any support for this proposal to withdraw.
                      Please note you might have a pending withdrawal of your
                      support.
                    </AlertDescription>
                  </Box>
                </Alert>
              ) : (
                <Box>
                  <Text
                    mb={4}
                    fontSize="sm"
                    fontWeight="medium"
                    color={textColor}
                  >
                    Current Support:{" "}
                    {formatNumber(currentSupportAmount, GOV_TOKEN_DECIMALS)}{" "}
                    {GOV_TOKEN_SYMBOL}
                  </Text>
                  <Text
                    mb={4}
                    fontSize="sm"
                    fontWeight="medium"
                    color={textColor}
                  >
                    Withdrawal Amount:{" "}
                    {formatNumber(selectedWithdrawalAmount, GOV_TOKEN_DECIMALS)}{" "}
                    {GOV_TOKEN_SYMBOL}
                  </Text>
                  <Slider
                    value={selectedWithdrawalAmount}
                    min={0}
                    max={maxWithdrawalAmount}
                    step={0.01}
                    onChange={(value) => setSelectedWithdrawalAmount(value)}
                    mb={4}
                    isDisabled={isStakingLoading || isStakingUninitialized}
                  >
                    <SliderMark value={0} mt="1" ml="-2.5" fontSize="sm">
                      0
                    </SliderMark>
                    <SliderMark
                      value={maxWithdrawalAmount}
                      mt="1"
                      ml="-2.5"
                      fontSize="sm"
                    >
                      {formatNumber(maxWithdrawalAmount, 1)}
                    </SliderMark>
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                  </Slider>
                  <Flex
                    justifyContent="space-between"
                    mt={2}
                    fontSize="xs"
                    color="gray.500"
                  >
                    <Text>
                      Current Support:{" "}
                      {formatNumber(currentSupportAmount, GOV_TOKEN_DECIMALS)}{" "}
                      {GOV_TOKEN_SYMBOL}
                    </Text>
                    <Text>
                      Remaining:{" "}
                      {formatNumber(
                        currentSupportAmount - selectedWithdrawalAmount,
                        GOV_TOKEN_DECIMALS,
                      )}{" "}
                      {GOV_TOKEN_SYMBOL}
                    </Text>
                  </Flex>
                </Box>
              )}

              <Flex width="100%" justifyContent="flex-end" gap={3} mt={6}>
                <Button
                  variant="ghost"
                  borderColor="gray.500"
                  borderWidth="1px"
                  borderRadius="md"
                  width="50%"
                  onClick={handleClose}
                  color={textColor}
                >
                  Cancel
                </Button>
                {isConnected && hasSupportToWithdraw && (
                  <Button
                    width="50%"
                    colorScheme="red"
                    onClick={handleWithdrawSupport}
                    isLoading={isLoading}
                    isDisabled={
                      selectedWithdrawalAmount === 0 ||
                      isStakingUninitialized ||
                      isStakingLoading ||
                      !bestPosition
                    }
                    loadingText="Withdrawing Support..."
                  >
                    Withdraw Support
                  </Button>
                )}
              </Flex>
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default WithdrawSupportModal
