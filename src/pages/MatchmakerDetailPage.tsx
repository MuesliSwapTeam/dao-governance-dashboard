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
  Spinner,
  Alert,
  AlertIcon,
  Link as ChakraLink,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useDisclosure,
} from "@chakra-ui/react"
import { LuExternalLink } from "react-icons/lu"
import React, { useState } from "react"
import { skipToken } from "@reduxjs/toolkit/query"
import { IoArrowBack } from "react-icons/io5"
import ProposalBarChart from "../components/ProposalBarChart"
import { formatNumber } from "../utils/numericHelpers"
import VotesBarChart from "../components/VotesBarChart"

import { useGetMatchmakerTallyDetailQuery } from "../api/tallyApi"
import { Proposal } from "../api/model/tally"
import useWalletContext from "../context/wallet"
import AddSupportModal from "../components/AddSupportModal"
import WithdrawSupportModal from "../components/WithdrawSupportModal"
import UserVoteIndicator from "../components/UserVoteIndicator"
import { useUserVotingInfo } from "../hooks/useUserVotingInfo"
import { CARDANOSCAN_URL } from "../constants"

const getInspectorUrl = (address: string, production = false) => {
  const baseUrl =
    production === true
      ? `https://cardanoscan.io/address/`
      : `${CARDANOSCAN_URL}/address/`

  return `${baseUrl}${address}`
}

const MatchmakerDetail: React.FC<{
  proposal: Proposal
  onAddSupport: (proposal: Proposal, batcherName: string) => void
  onWithdrawSupport: (proposal: Proposal, batcherName: string) => void
}> = ({ proposal, onAddSupport, onWithdrawSupport }) => {
  console.log("proposal:", proposal)
  const { isConnected } = useWalletContext()
  const { getUserVoteInfo } = useUserVotingInfo()
  const detailBg = useColorModeValue(
    "backgroundSecondary.light",
    "backgroundSecondary.dark",
  )
  const textColor = useColorModeValue("text.light", "text.dark")
  const statusColor = useColorModeValue("textSubtle.light", "textSubtle.dark")

  // Safety check for proposal data
  if (!proposal) {
    return (
      <Box bg={detailBg} p={8} borderRadius="md" boxShadow="md">
        <Text color={textColor}>No proposal data available</Text>
      </Box>
    )
  }

  // Transform status for display
  const getDisplayStatus = (status: string) => {
    return status === "open" ? "Passed" : "Pending"
  }

  // Get color based on status
  const getStatusColor = (status: string) => {
    return status === "open" ? "greens.500" : "blue.500"
  }

  const displayStatus = getDisplayStatus(proposal.status || "")
  const statusBaseColor = getStatusColor(proposal.status || "")

  const statusBgColor = useColorModeValue(
    `${statusBaseColor}.light`,
    `${statusBaseColor}.dark`,
  )
  const greenColor = useColorModeValue("greens.400.light", "greens.400.dark")
  const redColor = useColorModeValue("reds.default.light", "reds.default.dark")
  const blueColor = useColorModeValue("blue.500", "blue.500")

  const adaptedVotes = (proposal.votes || []).map((v: any, i: number) => ({
    weight: v.weight || 0,
    color: i == 0 ? redColor : greenColor,
    title: (
      <Text>
        {/*       <i> {i === 0 ? "Reject" : "Accept"} </i> */}
        {formatNumber(v.weight || 0, 0)} Votes
      </Text>
    ),
  }))

  // Find the license release vote to get the recipient address from details
  console.log("proposal.votes:", proposal.votes)
  const licenseReleaseVote = (proposal.votes || []).find(
    (vote) => vote.type === "LicenseRelease",
  )
  const licenseReleaseVoteId = (proposal.votes || []).findIndex(
    (vote) => vote.type === "LicenseRelease",
  )

  console.log("licenseReleaseVote:", licenseReleaseVote)
  console.log("licenseReleaseVoteId:", licenseReleaseVoteId)

  // Get recipient address from vote details
  const recipientAddress =
    licenseReleaseVote?.details?.recipient || "TO BE ADDED"

  console.log("license release vote:", licenseReleaseVote)
  console.log("recipient address:", recipientAddress)

  // Get user voting information for this proposal
  const userVoteInfo = getUserVoteInfo(proposal.id.toString())

  // Get batcher name for the proposal
  const batcherName = proposal.creatorName || "Unknown Batcher"

  return (
    <Box bg={detailBg} p={8} borderRadius="md" boxShadow="md">
      <Flex justify={"space-between"}>
        <Heading color={textColor}>
          {proposal.title || "Untitled Proposal"}
        </Heading>
        <Tag
          my="auto"
          height={"min-content"}
          color={statusColor}
          bgColor={statusBgColor}
        >
          {displayStatus}
        </Tag>
      </Flex>
      <ProposalBarChart
        proposal={proposal}
        colors={[redColor, greenColor]}
        height="5px"
        hideQuorumText
      />
      <Grid
        templateColumns={"auto 1fr"}
        mt="12px"
        rowGap="10px"
        columnGap="1em"
      >
        {/* ABOUT */}
        <GridItem alignContent="center" mb={4} colSpan={2}>
          {proposal.description || "No description available"}
        </GridItem>

        {/* User Vote Status */}
        {isConnected && (
          <GridItem colSpan={2} mb={4}>
            <UserVoteIndicator
              hasVoted={userVoteInfo.hasVoted}
              voteWeight={userVoteInfo.voteWeight}
            />
          </GridItem>
        )}

        {/* WALLET ADDRESS */}
        <GridItem alignContent="center">
          <Heading size="sm">Wallet Address: </Heading>
        </GridItem>
        <GridItem display="flex" gap={"8px"}>
          <ChakraLink
            target="_blank"
            rel="noopener noreferrer"
            href={
              recipientAddress !== "TO BE ADDED"
                ? getInspectorUrl(recipientAddress)
                : "#"
            }
            display="inline-flex"
            color={blueColor}
          >
            {recipientAddress}&nbsp;
            <LuExternalLink />
          </ChakraLink>
        </GridItem>

        {/* APPROVED WEIGHT */}
        <GridItem alignContent="center">
          <Heading size="sm"> Approve&nbsp;Votes: </Heading>
        </GridItem>
        <GridItem>
          <VotesBarChart
            votes={
              licenseReleaseVoteId >= 0 && adaptedVotes[licenseReleaseVoteId]
                ? [adaptedVotes[licenseReleaseVoteId]]
                : []
            }
            height="28px"
            quorum={proposal.quorum || 0}
          />
        </GridItem>
        {/* OVERVIEW */}
        <GridItem alignContent="center">
          <Heading size="sm">Overview: </Heading>
        </GridItem>
        <GridItem colSpan={2}>
          <Table variant="striped" colorScheme="gray">
            <Thead>
              <Tr>
                <Th>Num Transactions</Th>
                <Th>Min Profit</Th>
                <Th>Avg Profit</Th>
                <Th>Max Profit</Th>
                <Th>Total Profit</Th>
              </Tr>
            </Thead>
            <Tbody>
              <Tr>
                <Td>TO BE ADDED</Td>
                <Td>TO BE ADDED</Td>
                <Td>TO BE ADDED</Td>
                <Td>TO BE ADDED</Td>
                <Td>TO BE ADDED</Td>
              </Tr>
            </Tbody>
          </Table>
        </GridItem>
        {/* TRANSACTIONS */}
        {/* TODO: Currently hardcoded. Need to check the best way of getting those. */}
        <GridItem alignContent="center">
          <Heading size="sm"> Transactions: </Heading>
        </GridItem>
        <GridItem colSpan={2}>
          <Table variant="striped" colorScheme="gray">
            <Thead>
              <Tr>
                <Th>Trx Hash</Th>
                <Th>ADA Profit</Th>
                <Th>Non-ADA Profit</Th>
              </Tr>
            </Thead>
            <Tbody>
              {/* TODO: Transaction data not available in current API */}
              <Tr>
                <Td colSpan={3} textAlign="center">
                  TO BE ADDED - Transaction data not available in current API
                </Td>
              </Tr>
            </Tbody>
          </Table>
        </GridItem>

        {/* Action Buttons */}
        <GridItem colSpan={2} mt={6}>
          <Flex justify="flex-end" gap="3">
            <Button
              size="md"
              colorScheme="green"
              variant="solid"
              onClick={() => onAddSupport(proposal, batcherName)}
              isDisabled={!isConnected}
              _hover={{
                transform: "translateY(-1px)",
              }}
              transition="all 0.2s"
            >
              Add Support
            </Button>
            <Button
              size="md"
              colorScheme="red"
              variant="solid"
              onClick={() => onWithdrawSupport(proposal, batcherName)}
              isDisabled={!isConnected || !userVoteInfo.hasVoted}
              _hover={{
                transform: "translateY(-1px)",
              }}
              transition="all 0.2s"
            >
              Withdraw Support
            </Button>
          </Flex>
        </GridItem>
      </Grid>
    </Box>
  )
}

// TODO: Make sure this is correct.
// Backend isn't implemented properly so no good interface
// (format of json object, status code etc.) for error is defined yet.
const MatchmakerDetailPage: React.FC = () => {
  const { id, authNft } = useParams<{ id: string; authNft: string }>()

  // Modal state management
  const { isOpen, onOpen, onClose } = useDisclosure()
  const {
    isOpen: isWithdrawOpen,
    onOpen: onWithdrawOpen,
    onClose: onWithdrawClose,
  } = useDisclosure()
  const [selectedProposal, setSelectedProposal] = useState<{
    proposal: Proposal
    batcherName: string
  } | null>(null)
  const [selectedProposalForWithdraw, setSelectedProposalForWithdraw] =
    useState<{
      proposal: Proposal
      batcherName: string
    } | null>(null)

  const {
    data: tallies,
    isLoading,
    isError,
    error,
  } = useGetMatchmakerTallyDetailQuery(
    id && authNft
      ? { tally_proposal_id: id, tally_auth_nft: authNft }
      : skipToken,
  )

  const proposal = tallies?.[0]

  // Modal handlers
  const handleAddSupportClick = (proposal: Proposal, batcherName: string) => {
    setSelectedProposal({ proposal, batcherName })
    onOpen()
  }

  const handleWithdrawSupportClick = (
    proposal: Proposal,
    batcherName: string,
  ) => {
    setSelectedProposalForWithdraw({ proposal, batcherName })
    onWithdrawOpen()
  }

  const handleModalClose = () => {
    setSelectedProposal(null)
    onClose()
  }

  const handleWithdrawModalClose = () => {
    setSelectedProposalForWithdraw(null)
    onWithdrawClose()
  }

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

      {/* TODO: Test last case */}
      {isLoading ? (
        <Flex justifyContent="center" alignItems="center" height="50vh">
          <Spinner size="xl" />
        </Flex>
      ) : isError ? (
        <Alert status="error">
          <AlertIcon />
          {error && typeof error === "object" && "data" in error
            ? (error as any).data?.message
            : "An error occurred while fetching data."}
        </Alert>
      ) : proposal ? (
        <MatchmakerDetail
          proposal={proposal}
          onAddSupport={handleAddSupportClick}
          onWithdrawSupport={handleWithdrawSupportClick}
        />
      ) : (
        <Alert status="info">
          <AlertIcon />
          Matchmaker license not found
        </Alert>
      )}

      {/* Add Support Modal */}
      {selectedProposal && (
        <AddSupportModal
          isOpen={isOpen}
          onClose={handleModalClose}
          proposal={selectedProposal.proposal}
          batcherName={selectedProposal.batcherName}
        />
      )}

      {/* Withdraw Support Modal */}
      {selectedProposalForWithdraw && (
        <WithdrawSupportModal
          isOpen={isWithdrawOpen}
          onClose={handleWithdrawModalClose}
          proposal={selectedProposalForWithdraw.proposal}
          batcherName={selectedProposalForWithdraw.batcherName}
        />
      )}
    </Flex>
  )
}

export default MatchmakerDetailPage
