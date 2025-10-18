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
import { mintRetractVotePermission } from "../../cardano/staking/revoke_vote"
import { formatNumber, fromNativeAmount } from "../../utils/numericHelpers"
import { Participation, StakingPosition } from "../../api/model/staking"
import { Asset } from "../../api/model/common"
import { GOV_TOKEN_DECIMALS } from "../../cardano/config"

interface RevokeVoteModalProps {
  isOpen: boolean
  onClose: () => void
  position: StakingPosition
  participation: Participation
}

const RevokeVoteModal: FC<RevokeVoteModalProps> = ({
  isOpen,
  onClose,
  position,
  participation,
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

  const handleRevokeVote = async () => {
    setIsLoading(true)
    setError(null)
    setTxHash(null)
    try {
      const hash = await mintRetractVotePermission(
        convertToValue(position.funds),
        position.transaction_hash,
        position.output_index.toString(),
        participation.weight,
        participation.proposal_id,
        participation.end_time,
        participation.proposal_index.toString(),
        position.participations,
      )

      setTxHash(hash)
    } catch (error) {
      console.error("Revoke transaction failed", error)
      setError("Revoke transaction failed. Please try again.")
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

  const bgColor = useColorModeValue("background.light", "background.dark")
  const successColor = useColorModeValue("greens.500.light", "greens.500.dark")

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent bg={bgColor}>
        <ModalHeader textAlign="center" fontSize="xl" fontWeight="bold" p={4}>
          {isLoading ? "Revoking Vote" : txHash ? "Success" : "Revoke Vote"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody p={6}>
          {isLoading ? (
            <Box textAlign="center">
              <Spinner size="xl" />
              <Text mt={4}>Revoking Vote, please wait...</Text>
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
                <Text fontSize="lg">Revoke Transaction Successful!</Text>
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
                  <b>Proposal: </b> {participation.tally_metadata?.title}
                </Text>
                <Text fontSize="md" mb={2}>
                  <b>Vote: </b> {participation.proposal_metadata?.title}
                </Text>
                <Text fontSize="md" mb={2}>
                  <b>Vote Weight: </b>{" "}
                  {formatNumber(
                    fromNativeAmount(participation.weight, GOV_TOKEN_DECIMALS),
                    GOV_TOKEN_DECIMALS,
                  )}
                </Text>
              </Box>
              <Flex justify="space-evenly" mt={6} gap={2}>
                <Button onClick={handleRevokeVote} size="lg" flex="1">
                  Revoke Vote
                </Button>
                <Button variant="outline" onClick={onClose} size="lg" flex="1">
                  Cancel
                </Button>
              </Flex>
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default RevokeVoteModal
