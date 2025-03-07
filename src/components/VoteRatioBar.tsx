import React from "react"
import { Box, Text, useColorModeValue } from "@chakra-ui/react"

interface VoteRatioBarProps {
  votes: number
  total: number
  color?: string
  bgColor?: string
}

const VoteRatioBar: React.FC<VoteRatioBarProps> = ({
  votes,
  total,
  color,
  bgColor,
}) => {
  const votePercentage = total > 0 ? (votes / total) * 100 : 0

  const voteBgColor = useColorModeValue("accent.light", "accent.dark")
  const containerBgColor = useColorModeValue(
    "grays.200.light",
    "grays.200.dark",
  )

  return (
    <Box
      w="100%"
      h="30px"
      bg={bgColor ?? containerBgColor}
      borderRadius="md"
      overflow="hidden"
      position="relative"
    >
      <Box
        w={`${votePercentage}%`}
        h="100%"
        bg={color ?? voteBgColor}
        lineHeight="30px"
        borderRadius={votePercentage === 100 ? "md" : "md 0 0 md"}
      />
      {/* Text displaying the percentage */}
      <Text
        position="absolute"
        width="100%" // Full width of the parent box
        textAlign="center" // Center text horizontally
        top="50%" // Position the top edge of the element at the center of the parent
        transform="translateY(-50%)" // Vertically center the text
        lineHeight="30px" // Use line height equal to the height of the parent box to vertically center text
        fontSize="md"
        color="black"
      >
        {Math.round(votePercentage)}%
      </Text>
    </Box>
  )
}

export default VoteRatioBar
