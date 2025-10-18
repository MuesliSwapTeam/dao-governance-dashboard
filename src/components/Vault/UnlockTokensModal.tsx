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
import { formatNumber } from "../../utils/numericHelpers"
import {
  GOV_TOKEN_DECIMALS,
  GOV_TOKEN_SYMBOL,
} from "../../cardano/config"
import { VaultPosition } from "../../api/model/vault.ts"
import { closeVaultPosition } from "../../cardano/vault/base.ts"

interface UnlockTokensModalProps {
  isOpen: boolean
  onClose: () => void
  position: VaultPosition
}

const UnlockTokensModal: FC<UnlockTokensModalProps> = ({
  isOpen,
  onClose,
  position,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const bgColor = useColorModeValue("background.light", "background.dark")
  const successColor = useColorModeValue("greens.500.light", "greens.500.dark")

  const handleUnlockTokens = async () => {
    setIsLoading(true)
    setError(null)
    setTxHash(null)
    try {
      const hash = await closeVaultPosition(position)
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
                  <b>Tokens locked:</b>{" "}
                  {formatNumber(position.locked_amount, GOV_TOKEN_DECIMALS)}{" "}
                  {GOV_TOKEN_SYMBOL}
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
