import React, { Fragment, ReactElement, useMemo } from "react"
import {
  Flex,
  Box,
  Text,
  useColorModeValue,
  useMediaQuery,
} from "@chakra-ui/react"
import { formatNumber } from "../utils/numericHelpers"
import { GOV_TOKEN_DECIMALS } from "../cardano/config"

const VoteBar = (props: {
  title?: string | ReactElement
  color?: string
  share: number
  border?: "none" | "left" | "right" | "both"
  lineHeight?: string
}) => {
  const [hidingTitle] = useMediaQuery("(width: 100px)")
  const lineHeight = props.lineHeight ?? "30px"
  const borderRadius =
    props.border === "both"
      ? "md"
      : props.border === "left"
        ? "md 0 0 md"
        : props.border === "right"
          ? "0 md md 0"
          : ""

  if (props.share === 0) return undefined

  return (
    <Box
      w={`${props.share * 100}%`}
      h="100%"
      bg={props.color}
      borderRadius={borderRadius}
      lineHeight={lineHeight}
      position={"relative"}
      overflow="hidden"
    >
      {/* Text displaying the percentage */}
      {!hidingTitle && props.title ? (
        typeof props.title === "string" ? (
          <Text
            position="absolute"
            width="100%" // Full width of the parent box
            textAlign="center" // Center text horizontally
            top="50%" // Position the top edge of the element at the center of the parent
            transform="translateY(-50%)" // Vertically center the text
            lineHeight={lineHeight}
            fontSize="md"
            color="black"
          >
            {props.title}
          </Text>
        ) : (
          <Box
            position="absolute"
            width="100%" // Full width of the parent box
            textAlign="center" // Center text horizontally
            top="50%" // Position the top edge of the element at the center of the parent
            transform="translateY(-50%)" // Vertically center the text
            lineHeight={lineHeight}
          >
            {props.title}
          </Box>
        )
      ) : undefined}
    </Box>
  )
}

interface VotesBarChartProps {
  votes: {
    weight: number
    title: string | ReactElement
    color?: string
  }[]
  height?: string
  bgColor?: string
  quorum?: number
  hideQuorumText?: boolean
}

const VotesBarChart: React.FC<VotesBarChartProps> = ({
  votes,
  quorum,
  ...props
}) => {
  const voteBgColor = useColorModeValue("accent.light", "accent.dark")
  const voteSecBgColor = useColorModeValue(
    "accentPressed.light",
    "accentPressed.dark",
  )
  const containerBgColor = useColorModeValue(
    "grays.200.light",
    "grays.200.dark",
  )
  const quorumColor = useColorModeValue("white.500.light", "white.500.dark")
  const totalWeight = votes.reduce((p, c) => p + c.weight, 0)

  const height = props.height ?? "30px"
  const bgColor = props.bgColor ?? containerBgColor

  const [widthWeight, quorumPosition] = useMemo(() => {
    if (quorum != null) {
      return totalWeight > 1.25 * quorum
        ? [totalWeight, quorum / totalWeight]
        : [1.25 * quorum, 0.8]
    }
    return [totalWeight, 1]
  }, [totalWeight, quorum])

  return (
    <Flex
      flexDir="row"
      w="100%"
      h={height}
      bg={bgColor}
      borderRadius="md"
      overflow="hidden"
      position="relative"
    >
      {widthWeight > 0 &&
        votes.map((v, i, vs) => {
          const borderDir =
            vs.length === 1
              ? "both"
              : i === 0
                ? "left"
                : i === vs.length - 1
                  ? "right"
                  : "none"
          const color = v.color ?? (i % 2 === 0 ? voteBgColor : voteSecBgColor)
          const share = v.weight / widthWeight

          return (
            <Fragment key={i}>
              <VoteBar
                title={v.title}
                color={color}
                share={share}
                border={borderDir}
                lineHeight={height}
              />
            </Fragment>
          )
        })}
      {quorum != null && (
        <Flex
          flexDir="row"
          position="absolute"
          left={`${Math.round(100 * quorumPosition)}%`}
          height="100%"
          lineHeight={height}
        >
          <Box height="100%" width={"4px"} bg={quorumColor} borderRadius="sm" />
          {!props.hideQuorumText && (
            <Text
              color="black"
              lineHeight={height}
              ml="-8px"
              whiteSpace="nowrap"
              overflow="hidden"
              textAlign="left"
              position="absolute"
              left={`${Math.round(100 * quorumPosition)}%`} // Align with quorum line
            >
              {formatNumber(totalWeight, GOV_TOKEN_DECIMALS)} /{" "}
              {formatNumber(quorum, GOV_TOKEN_DECIMALS)} Votes{" "}
            </Text>
          )}
        </Flex>
      )}
    </Flex>
  )
}

export default VotesBarChart
