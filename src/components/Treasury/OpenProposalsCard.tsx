import {
  Box,
  Flex,
  Heading,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  Button,
} from "@chakra-ui/react"
import { useNavigate } from "react-router-dom"
import { Proposal } from "../../api/model/tally"
import { FaExternalLinkAlt } from "react-icons/fa"

const OpenProposalsCard = ({ proposals }: { proposals: Proposal[] }) => {
  const bgColor = useColorModeValue(
    "backgroundSecondary.light",
    "backgroundSecondary.dark",
  )

  const navigate = useNavigate()

  return (
    <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="lg">
      <Flex justify="space-between" align="center" mb={4}>
        <Heading as="h3" size="md">
          Open Proposals
        </Heading>
        <Button
          colorScheme="purple"
          onClick={() => navigate("/proposals/create")}
        >
          Create Treasury Proposal
        </Button>
      </Flex>

      <Text variant="md" mb={4}>
        These are the proposals currently up for voting.
      </Text>

      <Box overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Proposal ID</Th>
              <Th>Title</Th>
              <Th>Description</Th>
              <Th>End Date</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {proposals.map((vote, index) => (
              <Tr
                key={index}
                onClick={() => {
                  window.open(
                    `/proposals/${vote.authNft.policyId + "." + vote.authNft.name}/${vote.id}`,
                    "_blank",
                  )
                }}
              >
                <Td>{vote.id}</Td>
                <Td>{vote.title}</Td>
                <Td>{vote.description}</Td>
                <Td>{new Date(vote.endDate).toDateString()}</Td>
                <Td flexDir="row" display="flex">
                  Open&nbsp;&nbsp;
                  <FaExternalLinkAlt />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  )
}

export default OpenProposalsCard
