import { FC, useState } from "react"
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Box,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Icon,
  useColorModeValue,
  Spinner,
  Flex,
} from "@chakra-ui/react"
import { CheckCircleIcon } from "@chakra-ui/icons"
import { unlockTokens } from "../../cardano/staking/base"
import { formatNumber, fromNativeAmount } from "../../utils/numericHelpers"
import {
  GOV_TOKEN_DECIMALS,
  GOV_TOKEN_NAME_HEX,
  GOV_TOKEN_POLICY_ID,
  GOV_TOKEN_SYMBOL,
  VAULT_FT_TOKEN_POLICY_ID,
  VAULT_FT_TOKEN_SYMBOL,
} from "../../cardano/config"
import { StakingPosition } from "../../api/model/staking"
import { Asset } from "../../api/model/common"

interface UnlockTokensModalProps {
  isOpen: boolean
  onClose: () => void
  position: StakingPosition
}

const UnlockTokensModal: FC<UnlockTokensModalProps> = ({
  isOpen,
  onClose,
  position,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const convertToValue = (funds: Asset[]) => {
    const valueList: { unit: string; quantity: number }[] = []
    for (let l = 0; l < funds.length; l += 1) {
      let elm: Asset = funds[l]
      if (elm.policy_id === "") {
        valueList.push({ unit: "lovelace", quantity: Number(elm.amount) })
      } else {
        valueList.push({
          unit: elm.policy_id + elm.asset_name,
          quantity: Number(elm.amount),
        })
      }
    }

    return valueList
  }

  const handleUnlockTokens = async () => {
    setIsLoading(true)
    setError(null)
    setTxHash(null)
    try {
      const hash = await unlockTokens(
        position.transaction_hash,
        position.output_index.toString(),
        convertToValue(position.funds),
        position.participations,
      )
      setTxHash(hash)
    } catch (error) {
      console.error("Unlock transaction failed", error)
      setError("Unlock transaction failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setIsLoading(false)
    setError(null)
    setTxHash(null)
    onClose()
  }

  const getGovTokenAmount = (funds: Asset[]) => {
    funds = funds.filter(
      (x) =>
        x.policy_id === GOV_TOKEN_POLICY_ID &&
        x.asset_name === GOV_TOKEN_NAME_HEX,
    )
    if (funds.length === 0) return "0 " + GOV_TOKEN_SYMBOL
    const amount = fromNativeAmount(funds[0].amount, GOV_TOKEN_DECIMALS)
    return formatNumber(amount, GOV_TOKEN_DECIMALS) + " " + GOV_TOKEN_SYMBOL
  }

  const getFTAMount = (funds: Asset[]) => {
    funds = funds.filter((x) => x.policy_id === VAULT_FT_TOKEN_POLICY_ID)
    if (funds.length === 0) return "0 " + VAULT_FT_TOKEN_SYMBOL
    const ftSum = funds.reduce(
      (acc, curr) => Number(acc) + Number(curr.amount),
      0,
    )
    const amount = fromNativeAmount(ftSum, GOV_TOKEN_DECIMALS)
    return (
      formatNumber(amount, GOV_TOKEN_DECIMALS) + " " + VAULT_FT_TOKEN_SYMBOL
    )
  }

  const bgColor = useColorModeValue("background.light", "background.dark")
  const successColor = useColorModeValue("greens.500.light", "greens.500.dark")

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent bg={bgColor}>
        <ModalHeader textAlign="center" fontSize="xl" fontWeight="bold" p={4}>
          {isLoading
            ? "Unlocking Tokens"
            : txHash
              ? "Success"
              : "Unlock Tokens"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody p={6}>
          {isLoading ? (
            <Box textAlign="center">
              <Spinner size="xl" />
              <Text mt={4}>Unlocking tokens, please wait...</Text>
            </Box>
          ) : error ? (
            <Alert
              status="error"
              justifyItems="center"
              alignContent="center"
              gap="1em"
              borderRadius="8px"
            >
              <AlertIcon w={10} h={10} />
              <Box>
                <AlertTitle>Error!</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Box>
            </Alert>
          ) : txHash ? (
            <Box textAlign="center" color={successColor}>
              <Flex justify="center" align="center" gap="1em" mb="1em">
                <Icon as={CheckCircleIcon} w={10} h={10} />
                <Text fontSize="lg">Unlock Transaction Successful!</Text>
              </Flex>
              <Button
                as="a"
                href={`https://preprod.cardanoscan.io/transaction/${txHash}`}
                target="_blank"
                variant="link"
                m="1em"
                size="lg"
              >
                View on Cardanoscan
              </Button>
            </Box>
          ) : (
            <>
              <Box mb={4}>
                <Text fontSize="md" mb={2}>
                  <b>Tokens locked:</b> {getGovTokenAmount(position.funds)} +{" "}
                  {getFTAMount(position.funds)}
                </Text>
              </Box>
              <Flex justify="space-evenly" mt={6} gap={2}>
                <Button onClick={handleUnlockTokens} size="lg" flex="1">
                  Unlock
                </Button>
                <Button variant="outline" onClick={onClose} size="lg" flex="1">
                  Close
                </Button>
              </Flex>
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default UnlockTokensModal
