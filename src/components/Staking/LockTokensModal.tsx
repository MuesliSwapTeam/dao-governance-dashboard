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
import { lockTokens } from "../../cardano/staking/base"
import { toNativeAmount } from "../../utils/numericHelpers"
import { GOV_TOKEN_DECIMALS } from "../../cardano/config"

interface LockTokensModalProps {
  isOpen: boolean
  onClose: () => void
  balance: number
}

const LockTokensModal: FC<LockTokensModalProps> = ({
  isOpen,
  onClose,
  balance,
}) => {
  const [amount, setAmount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const handleLockTokens = async () => {
    setIsLoading(true)
    setError(null)
    setTxHash(null)
    try {
      const hash = await lockTokens(
        Number(toNativeAmount(amount, GOV_TOKEN_DECIMALS)),
        "dummy",
        0,
      )
      setTxHash(hash)
    } catch (error) {
      console.error("Transaction failed", error)
      setError("Transaction failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const isFormError = amount > balance || balance <= 0
  const isLockButtonDisabled = amount <= 0 || isFormError

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
                  Enter the amount of tokens you want to lock to gain voting
                  power
                </Text>
                <FormControl isInvalid={isFormError} isRequired>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <FormLabel fontSize="sm" mb={0}>
                      Amount to Lock
                    </FormLabel>
                    <Text fontSize="sm" color={textSubtleColor}>
                      Balance: {balance}
                    </Text>
                  </Box>
                  <NumberInput
                    bg={bgSecColor}
                    min={0}
                    value={amount}
                    onChange={(valueString) =>
                      setAmount(parseInt(valueString) || 0)
                    }
                    size="lg"
                  >
                    <NumberInputField />
                  </NumberInput>
                  <FormErrorMessage>
                    {amount > balance
                      ? "You don't own that many tokens"
                      : "You don't own any tokens"}
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
