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
import { mintAddVotePermission } from "../cardano/staking/add_vote"

interface AddSupportModalProps {
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

const AddSupportModal: React.FC<AddSupportModalProps> = ({
  isOpen,
  onClose,
  proposal,
  batcherName,
}) => {
  const { isConnected } = useWalletContext()
  const [selectedVotingPower, setSelectedVotingPower] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [walletAddressHex, setWalletAddressHex] = useState<string | null>(null)
  const [maxVotingPower, setMaxVotingPower] = useState<number>(0)
  const [bestPosition, setBestPosition] = useState<{
    position: StakingPosition
    votingPower: number
    index: number
  } | null>(null)
  const [totalStakingPower, setTotalStakingPower] = useState<number>(0)
  const [usedStakingPower, setUsedStakingPower] = useState<number>(0)
  const [hasExistingParticipation, setHasExistingParticipation] =
    useState(false)
  const toast = useToast()

  // Color mode values
  const detailBg = useColorModeValue(
    "backgroundSecondary.light",
    "backgroundSecondary.dark",
  )
  const textColor = useColorModeValue("text.light", "text.dark")
  const borderColor = useColorModeValue("gray.200", "gray.600")

  const [
    fetchStakingPositions,
    { isLoading: isStakingLoading, isUninitialized: isStakingUninitialized },
  ] = useLazyGetStakingPositionsQuery()

  const hasVotingPower = maxVotingPower > 0
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
      setSelectedVotingPower(0)
      setMaxVotingPower(0)
      setBestPosition(null)
    }
  }, [isConnected])

  // Fetch staking positions when wallet address is available
  useEffect(() => {
    if (isConnected && walletAddressHex) {
      setSelectedVotingPower(0)
      setMaxVotingPower(0)
      setBestPosition(null)
      setTotalStakingPower(0)
      setUsedStakingPower(0)
      setHasExistingParticipation(false)

      fetchStakingPositions({ wallet: walletAddressHex })
        .then(({ data: resData }) => {
          console.log("resData", resData)
          if (resData == null) return

          const position = resData[0] as StakingPosition

          if (!position) {
            toast({
              title: "No Staking Positions found",
              description: `Before you can add support, you need to stake some ${GOV_TOKEN_SYMBOL} first`,
              status: "error",
              duration: 5000,
              isClosable: true,
            })
            return
          }

          // Calculate total staking power and check for existing participation
          let totalPower = 0
          let usedPower = 0
          let hasParticipated = false

          const positionPower = getVotingPowerForBatcherSupport(position.funds)
          totalPower += positionPower

          // Calculate used voting power for this specific proposal
          let positionUsedPower = 0

          // Check participations for this proposal
          const participation = position.participations.find(
            (x) => x.proposal_id.toString() === proposal.id.toString(),
          )
          if (participation) {
            positionUsedPower += Number(
              fromNativeAmount(participation.weight, GOV_TOKEN_DECIMALS),
            )
            hasParticipated = true
          }

          // Check delegated actions for this proposal
          const delegatedAction = position.delegated_actions.find(
            (x) =>
              x.participation.proposal_id.toString() === proposal.id.toString(),
          )

          if (delegatedAction && delegatedAction.tag === "add_vote") {
            positionUsedPower += Number(
              fromNativeAmount(
                delegatedAction.participation.weight,
                GOV_TOKEN_DECIMALS,
              ),
            )
            hasParticipated = true
          }

          usedPower += positionUsedPower

          setTotalStakingPower(totalPower)
          setUsedStakingPower(usedPower)
          setBestPosition({
            position,
            votingPower: totalPower - usedPower,
            index: 0,
          })
          setHasExistingParticipation(hasParticipated)
          console.log("totalPower", totalPower)
          console.log("usedPower", usedPower)
          console.log("totalPower - usedPower", totalPower - usedPower)
          setMaxVotingPower(totalPower - usedPower)

          if (hasParticipated && usedPower >= totalPower) {
            toast({
              title: "All Voting Power Used",
              description: `You have already used all your available voting power for this proposal. Total used: ${formatNumber(usedPower, GOV_TOKEN_DECIMALS)} ${GOV_TOKEN_SYMBOL}`,
              status: "info",
              duration: 7000,
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

  const handleAddSupport = async () => {
    if (!isConnected || selectedVotingPower === 0 || !bestPosition) return

    setIsLoading(true)
    try {
      // Convert voting power to native units (like in ProposalDetailPage)
      const votingPowerNative = Math.floor(
        selectedVotingPower * Math.pow(10, GOV_TOKEN_DECIMALS),
      ).toString()

      // For batcher support, we vote "1" (accept/support) - index 1 is typically the support vote
      // Index 0 is usually reject, index 1 is support/accept
      const supportSelection = "1"

      // Call the same voting function as in ProposalDetailPage
      await mintAddVotePermission(
        bestPosition.position.funds.map((x) => {
          return {
            unit: x.policy_id === "" ? "lovelace" : x.policy_id + x.asset_name,
            quantity: Number(x.amount),
          }
        }),
        bestPosition.position.transaction_hash,
        bestPosition.position.output_index.toString(),
        votingPowerNative,
        proposal.id.toString(),
        proposal.endDatePosix?.toString() ?? null,
        supportSelection,
        bestPosition.position.participations.length > 0
          ? bestPosition.position.participations
          : undefined,
      )

      toast({
        title: "Support Added!",
        description: `Successfully added ${formatNumber(selectedVotingPower, GOV_TOKEN_DECIMALS)} ${GOV_TOKEN_SYMBOL} support to ${batcherName}'s license.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      })

      onClose()
    } catch (error) {
      console.error("Failed to add support:", error)
      toast({
        title: "Failed to Add Support",
        description:
          "There was an error adding your support. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedVotingPower(0)
    setIsLoading(false)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent bg={detailBg} borderColor={borderColor}>
        <ModalHeader color={textColor} fontSize="xl" fontWeight="semibold">
          Add Support to Batcher License
        </ModalHeader>
        <ModalCloseButton color={textColor} />
        <ModalBody pb={6}>
          <Box mb={6}>
            <Text fontWeight="semibold" mb={3} color={textColor} fontSize="lg">
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

            {/* FT Token Disclaimer */}
            <Alert status="info" borderRadius="md" mb={4}>
              <AlertIcon />
              <Box>
                <AlertTitle fontSize="sm">Note about FT Tokens</AlertTitle>
                <AlertDescription fontSize="xs">
                  Vault FT tokens cannot be used for batcher license support as
                  they have expiry dates. Only your governance tokens (
                  {GOV_TOKEN_SYMBOL}) can be used for this type of voting.
                </AlertDescription>
              </Box>
            </Alert>

            <Divider />
          </Box>

          {/* Previous Participation Status */}
          {hasExistingParticipation && (
            <Alert status="info" borderRadius="md" mb={4}>
              <AlertIcon />
              <Box>
                <AlertTitle fontSize="sm">
                  Previous Participation Detected
                </AlertTitle>
                <AlertDescription fontSize="xs">
                  You have already used{" "}
                  {formatNumber(usedStakingPower, GOV_TOKEN_DECIMALS)}{" "}
                  {GOV_TOKEN_SYMBOL} of your total{" "}
                  {formatNumber(totalStakingPower, GOV_TOKEN_DECIMALS)}{" "}
                  {GOV_TOKEN_SYMBOL} voting power for this proposal.{" "}
                  {maxVotingPower > 0 && (
                    <>
                      Remaining available:{" "}
                      {formatNumber(maxVotingPower, GOV_TOKEN_DECIMALS)}{" "}
                      {GOV_TOKEN_SYMBOL}
                    </>
                  )}
                </AlertDescription>
              </Box>
            </Alert>
          )}

          {!isConnected ? (
            <Box textAlign="center" py={6}>
              <Text mb={4} color={textColor}>
                Connect your wallet to add support to this batcher license
              </Text>
              <ConnectButton />
            </Box>
          ) : !hasVotingPower ? (
            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>No voting power available!</AlertTitle>
                <AlertDescription>
                  You need to stake some {GOV_TOKEN_SYMBOL} tokens to support
                  batcher licenses.{" "}
                  <Button
                    variant="link"
                    colorScheme="blue"
                    onClick={() => {
                      window.location.pathname = "/stake"
                    }}
                    size="sm"
                  >
                    Start staking here
                  </Button>
                </AlertDescription>
              </Box>
            </Alert>
          ) : (
            <Box>
              <Text mb={4} fontSize="sm" fontWeight="medium" color={textColor}>
                Select Support Amount:{" "}
                {formatNumber(selectedVotingPower, GOV_TOKEN_DECIMALS)}{" "}
                {GOV_TOKEN_SYMBOL}
              </Text>
              <Slider
                value={selectedVotingPower}
                min={0}
                max={maxVotingPower}
                step={0.01}
                onChange={(value) => setSelectedVotingPower(value)}
                mb={4}
                isDisabled={isStakingLoading || isStakingUninitialized}
              >
                <SliderMark value={0} mt="1" ml="-2.5" fontSize="sm">
                  0
                </SliderMark>
                <SliderMark
                  value={maxVotingPower}
                  mt="1"
                  ml="-2.5"
                  fontSize="sm"
                >
                  {formatNumber(maxVotingPower, 1)}
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
                  Available: {formatNumber(maxVotingPower, GOV_TOKEN_DECIMALS)}{" "}
                  {GOV_TOKEN_SYMBOL}
                </Text>
                {hasExistingParticipation && (
                  <Text>
                    Used: {formatNumber(usedStakingPower, GOV_TOKEN_DECIMALS)}{" "}
                    {GOV_TOKEN_SYMBOL}
                  </Text>
                )}
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
            {isConnected && hasVotingPower && (
              <Button
                width="50%"
                colorScheme="green"
                onClick={handleAddSupport}
                isLoading={isLoading}
                isDisabled={
                  selectedVotingPower === 0 ||
                  isStakingUninitialized ||
                  isStakingLoading ||
                  !bestPosition
                }
                loadingText="Adding Support..."
              >
                Add Support
              </Button>
            )}
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default AddSupportModal
