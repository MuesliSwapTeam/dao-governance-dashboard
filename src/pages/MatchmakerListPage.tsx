import {
  Box,
  Button,
  Flex,
  Heading,
  useColorModeValue,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Alert,
  AlertIcon,
  IconButton,
  useToast,
  Image as ChakraImage,
  Link as ChakraLink,
  useDisclosure,
} from "@chakra-ui/react"
import { useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { MdSwapHoriz } from "react-icons/md"
import { CheckCircleIcon, CopyIcon, TimeIcon } from "@chakra-ui/icons"

import cardanoScanLogo from "../assets/cardanoscan-favicon-32x32.png"
import cexplorerLogo from "../assets/cexplorer-favicon.svg"
import taptoolsLogo from "../assets/taptools-favicon.png"
import { GOV_TOKEN_SYMBOL } from "../cardano/config"
import { useGetMatchmakerTalliesQuery } from "../api/tallyApi"
import VoteRatioBar from "../components/VoteRatioBar"
import { matchmakeryEntry } from "../api/model/matchmakers"
import { Proposal } from "../api/model/tally"
import useWalletContext from "../context/wallet"
import AddSupportModal from "../components/AddSupportModal"
import WithdrawSupportModal from "../components/WithdrawSupportModal"
import UserVoteIndicator from "../components/UserVoteIndicator"
import { useUserVotingInfo } from "../hooks/useUserVotingInfo"
import { CARDANOSCAN_URL } from "../constants"

import { parseLicenseReleaseArgs } from "../utils/proposals"

// Transform Proposal objects from API to matchmakeryEntry objects expected by the component
const transformProposalToMatchmakerEntry = (
  proposal: Proposal,
): matchmakeryEntry => {
  // Determine status based on whether quorum has been reached
  // Since proposals run forever, they're either passed (quorum met) or pending (still collecting votes)
  const totalVotes = proposal.totalWeight
  const quorumMet = totalVotes >= proposal.quorum

  let status: "passed" | "pending" = quorumMet ? "passed" : "pending"

  // Extract address from license release vote details
  let addresses: string[] = ["TO BE ADDED"]
  try {
    // Find the license release vote and get the recipient from details
    const licenseVote = proposal.votes.find(
      (vote) => vote.type === "LicenseRelease",
    )
    if (licenseVote && licenseVote.details && licenseVote.details.recipient) {
      addresses = [licenseVote.details.recipient]
    } else {
      // Fallback to parsing license args if details not available
      const result = parseLicenseReleaseArgs(proposal)
      if (result.licenseArgs?.address) {
        addresses = [result.licenseArgs.address]
      }
    }
  } catch (error) {
    // If parsing fails, keep default "TO BE ADDED"
    console.warn("Could not extract batcher address:", error)
  }

  return {
    addresses,
    profit: {
      max_profit: 0, // TO BE ADDED - not available in current data
      min_profit: 0, // TO BE ADDED - not available in current data
      avg_profit: 0, // TO BE ADDED - not available in current data
      total: 0, // TO BE ADDED - not available in current data
    },
    status,
    proposal,
  }
}

const MatchmakerList: React.FC<{ matchmakers: matchmakeryEntry[] }> = ({
  matchmakers,
}) => {
  const { isConnected } = useWalletContext()
  const { getUserVoteInfo } = useUserVotingInfo()
  const textColor = useColorModeValue("text.light", "text.dark")
  const cardBg = useColorModeValue("white", "gray.800")
  const cardBorderColor = useColorModeValue("gray.200", "gray.700")
  const greenColor = useColorModeValue("greens.400.light", "greens.400.dark")

  const toast = useToast()
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

  return (
    <Flex flexDir="column" rowGap="1em">
      {matchmakers.map((mm) => {
        // Use the address from the transformed matchmaker entry
        const batcherAddress = mm.addresses[0] || "TO BE ADDED"

        // Get user voting information for this proposal
        const userVoteInfo = getUserVoteInfo(mm.proposal.id.toString())

        // Extract renewal interval from license release vote details
        let renewalIntervalDays = "TO BE ADDED"
        try {
          const licenseVote = mm.proposal.votes.find(
            (vote) => vote.type === "LicenseRelease",
          )
          if (
            licenseVote &&
            licenseVote.details &&
            licenseVote.details.license_validity
          ) {
            const validitySeconds = licenseVote.details.license_validity
            const validityDays = Math.round(validitySeconds / (24 * 60 * 60)) // Convert seconds to days
            renewalIntervalDays = `${validityDays} days`
          }
        } catch (error) {
          console.warn(
            "Could not extract renewal interval for proposal",
            mm.proposal.id,
            ":",
            error,
          )
        }

        return (
          <Box
            key={mm.proposal.output.hash + mm.proposal.output.index}
            p="24px"
            bg={cardBg}
            borderRadius="xl"
            boxShadow="sm"
            border={`1px solid ${cardBorderColor}`}
            _hover={{
              boxShadow: "lg",
              transform: "translateY(-2px)",
              transition: "all 0.2s ease-in-out",
            }}
            transition="all 0.2s ease-in-out"
          >
            {/* Header Section */}
            <Flex direction="column" gap="4">
              {/* Title and Status Badge */}
              <Flex justify="space-between" align="flex-start" width="100%">
                <Box flex="1" mr="4">
                  <Heading
                    as="h3"
                    size="lg"
                    color={textColor}
                    fontWeight="bold"
                    lineHeight="1.2"
                    mb="2"
                  >
                    {mm.proposal.title}
                  </Heading>

                  {/* Batcher Name */}
                  <Flex align="center" gap="2" mb="3">
                    <Text fontSize="sm" color="gray.500" fontWeight="medium">
                      Batcher:
                    </Text>
                    <Text fontSize="sm" color={textColor} fontWeight="semibold">
                      {mm.proposal.creatorName || "Unknown Batcher"}
                    </Text>
                  </Flex>
                </Box>

                {/* Status Badge */}
                <Box
                  px="3"
                  py="1"
                  borderRadius="full"
                  bg={mm.status === "passed" ? "green.100" : "blue.100"}
                  border={`1px solid ${mm.status === "passed" ? "green.300" : "blue.300"}`}
                >
                  <Text
                    fontSize="xs"
                    fontWeight="bold"
                    color={mm.status === "passed" ? "green.700" : "blue.700"}
                    textTransform="uppercase"
                    letterSpacing="wide"
                  >
                    {mm.status === "passed" ? "✓ Active" : "⏳ Pending"}
                  </Text>
                </Box>
              </Flex>

              {/* Description */}
              <Text color="gray.600" fontSize="sm" lineHeight="1.5">
                {mm.proposal.summary}
              </Text>

              {/* User Vote Status */}
              {isConnected && (
                <UserVoteIndicator
                  hasVoted={userVoteInfo.hasVoted}
                  voteWeight={userVoteInfo.voteWeight}
                />
              )}

              {/* Address and Renewal Interval Section */}
              <Box
                p="3"
                bg={useColorModeValue("gray.50", "gray.700")}
                borderRadius="lg"
                border={`1px solid ${useColorModeValue("gray.200", "gray.600")}`}
              >
                <Flex direction="column" gap="3">
                  {/* Batcher Address Row */}
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Text
                        fontSize="xs"
                        color="gray.500"
                        fontWeight="medium"
                        mb="1"
                      >
                        BATCHER MAIN ADDRESS
                      </Text>
                      <Text
                        fontSize="sm"
                        fontFamily="mono"
                        color={textColor}
                        fontWeight="medium"
                      >
                        {batcherAddress === "TO BE ADDED"
                          ? batcherAddress
                          : `${batcherAddress.slice(0, 12)}...${batcherAddress.slice(-12)}`}
                      </Text>
                    </Box>

                    <Flex align="center" gap="2">
                      {/* Explorer Links */}
                      {batcherAddress !== "TO BE ADDED" && (
                        <>
                          <ChakraLink
                            href={`${CARDANOSCAN_URL}/address/${batcherAddress}`}
                            isExternal
                            aria-label="Show on Cardanoscan"
                          >
                            <ChakraImage
                              src={cardanoScanLogo}
                              alt="Cardanoscan"
                              boxSize="20px"
                              opacity="0.7"
                              _hover={{ opacity: "1" }}
                              transition="opacity 0.2s"
                            />
                          </ChakraLink>
                          <ChakraLink
                            href={`https://preprod.cexplorer.io/address/${batcherAddress}`}
                            isExternal
                            aria-label="Show on Cexplorer"
                          >
                            <ChakraImage
                              src={cexplorerLogo}
                              alt="Cexplorer"
                              boxSize="20px"
                              opacity="0.7"
                              _hover={{ opacity: "1" }}
                              transition="opacity 0.2s"
                            />
                          </ChakraLink>
                          <ChakraLink
                            href={`https://taptools.io/address/${batcherAddress}`}
                            isExternal
                            aria-label="Show on Taptools"
                          >
                            <ChakraImage
                              src={taptoolsLogo}
                              alt="TapTools"
                              boxSize="20px"
                              opacity="0.7"
                              _hover={{ opacity: "1" }}
                              transition="opacity 0.2s"
                            />
                          </ChakraLink>

                          {/* Copy Button */}
                          <IconButton
                            icon={<CopyIcon />}
                            aria-label="Copy address"
                            onClick={() => {
                              navigator.clipboard.writeText(batcherAddress)
                              toast({
                                title: "Address copied!",
                                description:
                                  "The batcher main address has been copied to your clipboard.",
                                status: "success",
                                duration: 2000,
                                isClosable: true,
                              })
                            }}
                            size="sm"
                            variant="ghost"
                            colorScheme="gray"
                            _hover={{ bg: "gray.200" }}
                          />
                        </>
                      )}
                    </Flex>
                  </Flex>

                  {/* Renewal Interval Row */}
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Text
                        fontSize="xs"
                        color="gray.500"
                        fontWeight="medium"
                        mb="1"
                      >
                        RENEWAL INTERVAL
                      </Text>
                      <Text fontSize="sm" color={textColor} fontWeight="medium">
                        {renewalIntervalDays}
                      </Text>
                    </Box>
                  </Flex>
                </Flex>
              </Box>
            </Flex>
            {/* Voting Section */}
            <Box mt="6">
              {mm.status === "passed" ? (
                <Box>
                  <Flex justify="space-between" align="center" mb="3">
                    <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                      Total Support
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {(
                        (mm.proposal.totalWeight / mm.proposal.quorum) *
                        100
                      ).toFixed(1)}
                      % of Quorum
                    </Text>
                  </Flex>
                  <VoteRatioBar
                    votes={mm.proposal.totalWeight}
                    total={mm.proposal.totalWeight} // This makes it 100% filled
                    color={greenColor}
                  />
                  <Flex justify="space-between" align="center" mt="2">
                    <Text fontSize="lg" fontWeight="bold" color={greenColor}>
                      {mm.proposal.totalWeight.toLocaleString()}{" "}
                      {GOV_TOKEN_SYMBOL}
                    </Text>
                    <Text
                      fontSize="sm"
                      color={greenColor}
                      fontWeight="semibold"
                    >
                      ✓ Quorum Reached
                    </Text>
                  </Flex>
                </Box>
              ) : (
                <Box>
                  <Flex justify="space-between" align="center" mb="3">
                    <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                      Current Support
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {(
                        (mm.proposal.totalWeight / mm.proposal.quorum) *
                        100
                      ).toFixed(1)}
                      % of Quorum
                    </Text>
                  </Flex>
                  <VoteRatioBar
                    votes={mm.proposal.totalWeight}
                    total={mm.proposal.quorum}
                    color="blue.400"
                  />
                  <Flex justify="space-between" align="center" mt="2">
                    <Text fontSize="lg" fontWeight="bold" color={textColor}>
                      {mm.proposal.totalWeight.toLocaleString()}{" "}
                      {GOV_TOKEN_SYMBOL}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      Need{" "}
                      {(
                        mm.proposal.quorum - mm.proposal.totalWeight
                      ).toLocaleString()}{" "}
                      more
                    </Text>
                  </Flex>
                </Box>
              )}
            </Box>

            {/* Action Buttons */}
            <Flex mt="6" justify="flex-end" gap="3">
              <Button
                size="md"
                colorScheme="green"
                variant="solid"
                onClick={() =>
                  handleAddSupportClick(
                    mm.proposal,
                    mm.proposal.creatorName || "Unknown Batcher",
                  )
                }
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
                onClick={() =>
                  handleWithdrawSupportClick(
                    mm.proposal,
                    mm.proposal.creatorName || "Unknown Batcher",
                  )
                }
                isDisabled={!isConnected || !userVoteInfo.hasVoted}
                _hover={{
                  transform: "translateY(-1px)",
                }}
                transition="all 0.2s"
              >
                Withdraw Support
              </Button>
              <Link
                to={`/matchmakers/${mm.proposal.authNft.policyId}.${mm.proposal.authNft.name}/${mm.proposal.id}`}
              >
                <Button
                  size="md"
                  colorScheme="blue"
                  variant="outline"
                  _hover={{
                    bg: "blue.50",
                    transform: "translateY(-1px)",
                  }}
                  transition="all 0.2s"
                >
                  View Details
                </Button>
              </Link>
            </Flex>
          </Box>
        )
      })}

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

const MatchmakerListPage: React.FC = () => {
  const {
    data: tallies,
    isLoading,
    error,
  } = useGetMatchmakerTalliesQuery({ open: true, closed: true })

  // Transform tallies to matchmaker entries
  const matchmakers = useMemo(() => {
    if (!tallies) return []
    return tallies.map(transformProposalToMatchmakerEntry)
  }, [tallies])

  const [passedLicenses, pendingLicenses] = useMemo(() => {
    const passedLicenses = matchmakers.filter((m) => m.status === "passed")
    const pendingLicenses = matchmakers.filter((m) => m.status === "pending")

    return [passedLicenses, pendingLicenses]
  }, [matchmakers])

  const tabMapping = ["passed", "pending"]

  const [searchParams, setSearchParams] = useSearchParams()
  const tabIndex = tabMapping.indexOf(searchParams.get("tab") ?? "passed") // Default to passed licenses

  const handleTabChange = (index: number) => {
    setSearchParams({ tab: tabMapping[index].toString() })
  }

  const textColor = useColorModeValue("text.light", "text.dark")

  return (
    <Box m="24px 16px" sx={{ textAlign: "start" }}>
      <Flex justify="space-between" align="center" p="16px" mb="48px">
        <Heading display="flex" alignItems="center" color={textColor}>
          <MdSwapHoriz size="32px" style={{ marginRight: "8px" }} />
          Matchmaker Licenses
        </Heading>
      </Flex>
      {isLoading ? (
        <Flex justify="center" align="center" height="100vh">
          <Spinner size="xl" />
        </Flex>
      ) : error ? (
        <Alert status="error">
          <AlertIcon />
          There was an error while requesting the data.
        </Alert>
      ) : (
        <Tabs variant="enclosed" index={tabIndex} onChange={handleTabChange}>
          <Flex flexDir="row" justify="space-between" align="center" mx="16px">
            <TabList>
              <Tab _selected={{ color: "white", bg: "green.500" }}>
                <CheckCircleIcon mr="2" /> Active Licenses
              </Tab>
              <Tab _selected={{ color: "white", bg: "blue.500" }}>
                <TimeIcon mr="2" /> Pending Licenses
              </Tab>
            </TabList>
          </Flex>
          <TabPanels>
            <TabPanel>
              <MatchmakerList matchmakers={passedLicenses} />
            </TabPanel>
            <TabPanel>
              <MatchmakerList matchmakers={pendingLicenses} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}
    </Box>
  )
}

export default MatchmakerListPage
