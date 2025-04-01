import { FC, useState } from "react"
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Text,
  useColorModeValue,
  Link,
} from "@chakra-ui/react"
import { Link as RouterLink } from "react-router-dom"
import { ExternalLinkIcon } from "@chakra-ui/icons"
import {
  TALLY_AUTH_NFT_NAME_HEX,
  TALLY_AUTH_NFT_POLICY_ID,
} from "../../cardano/config"
import { Participation, StakingPosition } from "../../api/model/staking"
import RemoveVoteModal from "./RevokeVoteModal"

interface ParticipationsTableProps {
  stakingPosition: StakingPosition
  displayLockDate: (date: Date, showVoteEnded: boolean) => string
}

const ParticipationsTable: FC<ParticipationsTableProps> = ({
  stakingPosition,
  displayLockDate,
}) => {
  const participations: Participation[] = stakingPosition.participations

  const handleRemoveVote = (participation: Participation) => {
    setSelectedParticipation(participation)
  }

  const [selectedParticipation, setSelectedParticipation] =
    useState<Participation | null>(null)

  const handleCloseVoteRemove = () => {
    setSelectedParticipation(null)
  }

  const disabledColor = useColorModeValue("grays.300.dark", "grays.600.dark")

  return participations.length > 0 ? (
    <Table size="sm" variant="simple">
      <Thead>
        <Tr>
          <Th>Proposal Title</Th>
          <Th>Your Vote</Th>
          <Th>End Date</Th>
          <Th>Action</Th>
        </Tr>
      </Thead>
      <Tbody>
        {participations.map((p, idx) => {
          const unlockDate = new Date(Number(p.end_time))
          const now = new Date()
          const isVoteActive = unlockDate > now

          return (
            <Tr key={idx}>
              <Td>
                <Link
                  as={RouterLink}
                  to={`/proposals/${TALLY_AUTH_NFT_POLICY_ID}.${TALLY_AUTH_NFT_NAME_HEX}/${p.proposal_id}`}
                >
                  {p.tally_metadata?.title ?? p.proposal_id}
                  <ExternalLinkIcon ml={1} />
                </Link>
              </Td>
              <Td>
                <i>{p.proposal_metadata?.title ?? p.proposal_index}</i>
              </Td>
              <Td>{displayLockDate(unlockDate, true)}</Td>
              <Td>
                <Button
                  title={
                    !isVoteActive
                      ? "Proposal has ended. Votes can only be revoked for running proposals."
                      : undefined
                  }
                  size="sm"
                  isDisabled={!isVoteActive}
                  _hover={{
                    bg: !isVoteActive ? disabledColor : undefined,
                  }}
                  bg={!isVoteActive ? disabledColor : undefined}
                  _disabled={{ cursor: "not-allowed" }}
                  onClick={() => handleRemoveVote(p)}
                >
                  Revoke Vote
                </Button>
              </Td>
            </Tr>
          )
        })}
      </Tbody>
      {selectedParticipation && (
        <RemoveVoteModal
          isOpen={!!selectedParticipation}
          onClose={handleCloseVoteRemove}
          position={stakingPosition}
          participation={selectedParticipation}
        />
      )}
    </Table>
  ) : (
    <Text ml="15px">You did not participate in any votes.</Text>
  )
}

export default ParticipationsTable
