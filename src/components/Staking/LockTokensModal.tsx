import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  Box,
  useColorModeValue,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Icon,
  FormErrorMessage,
  Flex,
} from "@chakra-ui/react"
import { useState, FC } from "react"
import { CheckCircleIcon } from "@chakra-ui/icons"
import { lockTokens, lockTokensContinuation } from "../../cardano/staking/base"
import { toNativeAmount } from "../../utils/numericHelpers"
import {
  GOV_TOKEN_DECIMALS,
  GOV_TOKEN_SYMBOL,
  VAULT_FT_TOKEN_SYMBOL,
} from "../../cardano/config"
import { StakingPosition } from "../../api/model/staking"

interface LockTokensModalProps {
  isOpen: boolean
  onClose: () => void
  balance?: number
  ftBalance?: number
  position?: StakingPosition
}

const LockTokensModal: FC<LockTokensModalProps> = ({
  isOpen,
  onClose,
  balance,
  ftBalance,
  position,
}) => {
  const [milkAmount, setMilkAmount] = useState(0)
  const [ftAmount, setFtAmount] = useState(ftBalance)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const handleLockTokens = async () => {
    setIsLoading(true)
    setError(null)
    setTxHash(null)
    try {
      // Updated transaction logic now supports specific FT amounts
      if (!position) {
        const hash = await lockTokens(
          Number(toNativeAmount(milkAmount, GOV_TOKEN_DECIMALS)),
          (ftAmount ?? 0) > 0 ? ftAmount : undefined,
        )
        setTxHash(hash)
      } else {
        const hash = await lockTokensContinuation(
          position,
          Number(toNativeAmount(milkAmount, GOV_TOKEN_DECIMALS)),
          (ftAmount ?? 0) > 0 ? ftAmount : undefined,
        )
        setTxHash(hash)
      }
    } catch (error) {
      console.error("Transaction failed", error)
      setError("Transaction failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const isMilkError =
    milkAmount > (balance || 0) || (milkAmount > 0 && (balance || 0) <= 0)
  const isFtError =
    (ftAmount ?? 0) > (ftBalance || 0) || ((ftAmount ?? 0) > 0 && (ftBalance || 0) <= 0)
  const isFormError = isMilkError || isFtError
  const isLockButtonDisabled = (milkAmount <= 0 && (ftAmount ?? 0) <= 0) || isFormError

  const bgColor = useColorModeValue("background.light", "background.dark")
  const bgSecColor = useColorModeValue(
    "backgroundSecondary.light",
    "backgroundSecondary.dark",
  )
  const textSubtleColor = useColorModeValue(
    "textSubtle.light",
    "textSubtle.dark",
  )
  const disabledColor = useColorModeValue("grays.200.light", "grays.800.dark")
  const successColor = useColorModeValue("greens.500.light", "greens.500.dark")

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setIsLoading(false)
        setError(null)
        setTxHash(null)
        onClose()
      }}
    >
      <ModalOverlay />
      <ModalContent bg={bgColor}>
        <ModalHeader textAlign="center" fontSize="xl" fontWeight="bold" p={4}>
          {isLoading
            ? "Creating Transaction"
            : txHash
              ? "Success"
              : "Lock Tokens"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody p={6}>
          {isLoading ? (
            <Box textAlign="center">
              <Spinner size="xl" />
              <Text mt={4}>Creating transaction, please wait...</Text>
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
                <Text fontSize="lg">Transaction Created!</Text>
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
                <Text fontSize="md" mb={4}>
                  Enter the amounts of tokens you want to lock to gain voting
                  power
                </Text>

                {/* MILK Token Input */}
                <FormControl isInvalid={isMilkError} mb={4}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <FormLabel fontSize="sm" mb={0}>
                      {GOV_TOKEN_SYMBOL} Amount to Lock
                    </FormLabel>
                    <Text fontSize="sm" color={textSubtleColor}>
                      Balance: {balance || 0}
                    </Text>
                  </Box>
                  <NumberInput
                    bg={bgSecColor}
                    min={0}
                    value={milkAmount}
                    onChange={(valueString) =>
                      setMilkAmount(parseInt(valueString) || 0)
                    }
                    size="lg"
                  >
                    <NumberInputField />
                  </NumberInput>
                  <FormErrorMessage>
                    {milkAmount > (balance || 0)
                      ? `You don't own that many ${GOV_TOKEN_SYMBOL} tokens`
                      : `You don't own any ${GOV_TOKEN_SYMBOL} tokens`}
                  </FormErrorMessage>
                </FormControl>

                {/* FT Token Input */}
                <FormControl isInvalid={isFtError}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <FormLabel fontSize="sm" mb={0}>
                      {VAULT_FT_TOKEN_SYMBOL} Amount to Lock
                    </FormLabel>
                    <Text fontSize="sm" color={textSubtleColor}>
                      Balance: {ftBalance || 0}
                    </Text>
                  </Box>
                  <NumberInput
                    bg={bgSecColor}
                    min={0}
                    value={ftAmount}
                    onChange={(valueString) =>
                      setFtAmount(parseInt(valueString) || 0)
                    }
                    size="lg"
                  >
                    <NumberInputField />
                  </NumberInput>
                  <FormErrorMessage>
                    {(ftAmount ?? 0) > (ftBalance || 0)
                      ? `You don't own that many ${VAULT_FT_TOKEN_SYMBOL} tokens`
                      : `You don't own any ${VAULT_FT_TOKEN_SYMBOL} tokens`}
                  </FormErrorMessage>
                </FormControl>
              </Box>
              <Flex justify="space-evenly" mt={6} gap={2}>
                <Button
                  onClick={handleLockTokens}
                  size="lg"
                  flex="2"
                  isDisabled={isLockButtonDisabled}
                  bg={isLockButtonDisabled ? disabledColor : undefined}
                  _disabled={{
                    cursor: "not-allowed",
                  }}
                >
                  Lock
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

export default LockTokensModal
