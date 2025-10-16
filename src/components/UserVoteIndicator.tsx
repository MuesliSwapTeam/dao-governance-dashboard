import React from "react"
import { Box, Text, Flex, Icon, useColorModeValue } from "@chakra-ui/react"
import { CheckCircleIcon } from "@chakra-ui/icons"
import { GOV_TOKEN_SYMBOL } from "../cardano/config"

interface UserVoteIndicatorProps {
  hasVoted: boolean
  voteWeight?: string
}

/**
 * Component to display user's voting status on a proposal
 */
const UserVoteIndicator: React.FC<UserVoteIndicatorProps> = ({
  hasVoted,
  voteWeight,
}) => {
  const voteColor = useColorModeValue("green.600", "green.400")
  const voteBgColor = useColorModeValue("green.50", "green.900")
  const voteBorderColor = useColorModeValue("green.200", "green.700")

  if (!hasVoted) {
    return null
  }

  return (
    <Box
      px="3"
      py="2"
      bg={voteBgColor}
      borderRadius="lg"
      border={`1px solid ${voteBorderColor}`}
      maxWidth="fit-content"
    >
      <Flex align="center" gap="2">
        <Icon as={CheckCircleIcon} color={voteColor} boxSize="4" />
        <Box>
          <Text
            fontSize="xs"
            fontWeight="bold"
            color={voteColor}
            lineHeight="1.2"
          >
            ✓ You support this with {voteWeight} {GOV_TOKEN_SYMBOL}
          </Text>
        </Box>
      </Flex>
    </Box>
  )
}

export default UserVoteIndicator
