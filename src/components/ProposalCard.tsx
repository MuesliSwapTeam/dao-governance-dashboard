import {
  Box,
  Flex,
  Text,
  Tag,
  Button,
  useColorModeValue,
} from "@chakra-ui/react"
import { Link } from "react-router-dom"

interface Proposal {
  id: string
  title: string
  status: string
  summary: string
  votesYes: number
  votesNo: number
  endDate: string
  authNft: string
}

interface ProposalCardProps {
  proposal: Proposal
}

const ProposalCard: React.FC<ProposalCardProps> = ({ proposal }) => {
  const cardBg = useColorModeValue(
    "backgroundSecondary.light",
    "backgroundSecondary.dark",
  )
  const textColor = useColorModeValue("text.light", "text.dark")
  const statusColor = useColorModeValue("textSubtle.light", "textSubtle.dark")
  const statusBaseColor =
    proposal.status === "open" ? "greens.500" : "greys.500"
  const statusBgColor = useColorModeValue(
    `${statusBaseColor}.light`,
    `${statusBaseColor}.dark`,
  )
  const buttonBg = useColorModeValue("accent.light", "accent.dark")
  const buttonHoverBg = useColorModeValue(
    "accentPressed.light",
    "accentPressed.dark",
  )

  return (
    <Box bg={cardBg} p={4} borderRadius="md" boxShadow="md" mb={4}>
      <Flex justify="space-between">
        <Text fontSize="xl" fontWeight="bold" color={textColor}>
          {proposal.title}
        </Text>
        <Tag color={statusColor} bgColor={statusBgColor}>
          {proposal.status}
        </Tag>
      </Flex>
      <Text mt={2} color={textColor}>
        {proposal.summary}
      </Text>
      <Flex justify="space-between" mt={4}>
        <Text color={statusColor}>
          {new Date(proposal.endDate).toLocaleString()}
        </Text>
        <Link to={`/proposals/${proposal.authNft}/${proposal.id}`}>
          <Button bg={buttonBg} _hover={{ bg: buttonHoverBg }} color="white">
            View Details
          </Button>
        </Link>
      </Flex>
    </Box>
  )
}

export default ProposalCard
