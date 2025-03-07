import { Link, useParams } from "react-router-dom"
import {
  Box,
  Heading,
  Text,
  Flex,
  useColorModeValue,
  Button,
  Tag,
  Grid,
  GridItem,
} from "@chakra-ui/react"
import React, { useMemo } from "react"
import { useGetTallyDetailQuery } from "../api/tallyApi"
import { skipToken } from "@reduxjs/toolkit/query"
import { IoArrowBack } from "react-icons/io5"
// import VoteRatioBar from "../components/VoteRatioBar";
import { Proposal } from "../api/model/tally"
import {
  isLicenseReleaseProposal,
  parseLicenseReleaseArgs,
} from "../utils/proposals"
/* import { FaShareAlt, FaShareAltSquare } from "react-icons/fa";
import { FaShareNodes } from "react-icons/fa6"; */
import ProposalBarChart from "../components/ProposalBarChart"
import { formatNumber } from "../utils/numericHelpers"
import VotesBarChart from "../components/VotesBarChart"

const MatchmakerDetail: React.FC<{ proposal?: Proposal }> = ({ proposal }) => {
  const detailBg = useColorModeValue(
    "backgroundSecondary.light",
    "backgroundSecondary.dark",
  )
  const textColor = useColorModeValue("text.light", "text.dark")
  const statusColor = useColorModeValue("textSubtle.light", "textSubtle.dark")
  const statusBaseColor =
    proposal?.status === "open" ? "greens.500" : "greys.500"
  const statusBgColor = useColorModeValue(
    `${statusBaseColor}.light`,
    `${statusBaseColor}.dark`,
  )
  const greenColor = useColorModeValue("greens.400.light", "greens.400.dark")
  const redColor = useColorModeValue("reds.default.light", "reds.default.dark")

  const licenseArgs = useMemo(
    () => (proposal ? parseLicenseReleaseArgs(proposal) : undefined!),
    [proposal],
  )

  if (!proposal) {
    return <Text color={textColor}>License not found</Text>
  }

  if (!isLicenseReleaseProposal(proposal)) {
    return <Text color={textColor}>Proposal of wrong kind</Text>
  }

  const fakeVotes = proposal.votes.map((v) => ({
    ...v,
    weight: v.weight + (Math.random() / 2.0) * proposal.quorum,
  }))
  const fakeProposal = {
    ...proposal,
    votes: fakeVotes,
    totalWeight: fakeVotes.reduce((p, v) => p + v.weight, 0),
  }

  const adaptedVotes = fakeProposal.votes.map((v, i) => ({
    weight: v.weight,
    color: i == 0 ? redColor : greenColor,
    title: (
      <Text>
        {/*       <i> {i === 0 ? "Reject" : "Accept"} </i> */}
        {formatNumber(v.weight, 0)} Votes
      </Text>
    ),
  }))

  return (
    <Box bg={detailBg} p={8} borderRadius="md" boxShadow="md">
      <Flex justify={"space-between"}>
        <Heading color={textColor}>{proposal.title}</Heading>
        <Tag
          my="auto"
          height={"min-content"}
          color={statusColor}
          bgColor={statusBgColor}
        >
          {proposal.status}
        </Tag>
      </Flex>
      <ProposalBarChart
        proposal={fakeProposal}
        colors={[redColor, greenColor]}
        height="5px"
        hideQuorumText
      />
      <Text mt={4} whiteSpace={"pre-line"} color={textColor}>
        {proposal.description}
      </Text>

      <Grid templateColumns={"auto 1fr"} mt="12px" rowGap="6px" columnGap="1em">
        <GridItem alignContent="center">
          <Heading size="sm">Wallet Address: </Heading>
        </GridItem>
        <GridItem
          display="flex"
          justifyContent={"flex-end"}
          alignItems={"center"}
          gap={"8px"}
        >
          <Text>{licenseArgs.address}</Text>
          {/* TODO pjordan: Figure out how to make margins smaller */}
          {/*           <Button p="0" size="sm" aria-label="Show on cardanoscan" as={FaShareAltSquare} onClick={() => window.open(`https://cardanoscan.io/address/${licenseArgs}`, '_blank')} />
          <Button p="0" size="sm" aria-label="Show on cexplorer" as={FaShareNodes} onClick={() => window.open(`https://cardanoscan.io/address/${licenseArgs}`, '_blank')} />
          <Button p="0" size="sm" aria-label="Show on taptools" as={FaShareAlt} onClick={() => window.open(`https://cardanoscan.io/address/${licenseArgs}`, '_blank')} /> */}
        </GridItem>
        <GridItem alignContent="center">
          <Heading size="sm"> Approve&nbsp;Votes: </Heading>
        </GridItem>
        <GridItem>
          <VotesBarChart
            votes={[adaptedVotes[1]]}
            height="28px"
            quorum={proposal.quorum}
          />
        </GridItem>
        <GridItem alignContent="center">
          <Heading size="sm"> Revoke&nbsp;Votes: </Heading>
        </GridItem>
        <GridItem>
          <VotesBarChart
            votes={[adaptedVotes[0]]}
            height="28px"
            quorum={proposal.quorum}
          />
        </GridItem>
      </Grid>

      <Text mt={4} color={statusColor}>
        End Date: {new Date(proposal.endDate).toLocaleString()}
      </Text>

      {/* TODO pjordan: A history of last matches/profits/... would be nice here :) */}

      {/*     <>
      <Box height="400px" />
      Only shows split
      <ProposalBarChart proposal={fakeProposal}
        colors={[redColor, greenColor]}
        height="5px"
        hideQuorumText
      />
      <Box height="40px" />
      Shows split and also quorum marker
      <ProposalBarChart proposal={fakeProposal}
        colors={[redColor, greenColor]}
        height="5px"
        showQuorum
        hideQuorumText
      />
      <Box height="40px" />
      Shows split and also quorum marker, w explanatory text
      <ProposalBarChart proposal={fakeProposal}
        colors={[redColor, greenColor]}
        titleFn={(v, i) => (
          <Text>
            <i> {i === 0 ? "Reject" : "Accept"} </i>
            {formatNumber(v.weight, 0)} Votes
            ({Math.round(100 * v.weight / fakeProposal.totalWeight)}%)
          </Text>
        )}
        height="40px"
        showQuorum
      />
    </> */}
    </Box>
  )
}

const MatchmakerDetailPage: React.FC = () => {
  const { id, authNft } = useParams<{ id: string; authNft: string }>()
  const { data: proposal } = useGetTallyDetailQuery(
    id && authNft
      ? { tally_proposal_id: id, tally_auth_nft: authNft }
      : skipToken,
  )

  const buttonBg = useColorModeValue("accent.light", "accent.dark")
  const buttonHoverBg = useColorModeValue(
    "accentPressed.light",
    "accentPressed.dark",
  )

  return (
    <Flex
      flexDir="column"
      m="24px 16px"
      sx={{ textAlign: "start" }}
      rowGap={"1em"}
    >
      <Link to={`/matchmakers`}>
        <Button
          leftIcon={<IoArrowBack />}
          bg={buttonBg}
          _hover={{ bg: buttonHoverBg }}
          color="white"
        >
          Matchmakers
        </Button>
      </Link>
      <MatchmakerDetail proposal={proposal?.at(0)} />
    </Flex>
  )
}

export default MatchmakerDetailPage
