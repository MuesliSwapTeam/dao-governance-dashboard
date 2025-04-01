import { Link, useParams } from "react-router-dom"
import {
  Box,
  Heading,
  Text,
  Flex,
  useColorModeValue,
  Button,
  Tag,
  RadioGroup,
  Stack,
  Radio,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Divider,
} from "@chakra-ui/react"
import React, { useState, useEffect } from "react"
import { useGetTallyDetailQuery } from "../api/tallyApi"
import { skipToken } from "@reduxjs/toolkit/query"
import { IoArrowBack } from "react-icons/io5"
import { ChevronDownIcon, CheckIcon, PlusSquareIcon } from "@chakra-ui/icons"
import { TiDocument, TiKey, TiCog } from "react-icons/ti"
import { FaDollarSign, FaThumbsUp } from "react-icons/fa"
import { Proposal } from "../api/model/tally"
import VotesBarChart from "../components/VotesBarChart"
import { formatNumber } from "../utils/numericHelpers"
import ProposalBarChart from "../components/ProposalBarChart"
import { mintAddVotePermission } from "../cardano/staking/add_vote"
import { useLazyGetStakingPositionsQuery } from "../api/stakingApi"
import useWalletContext from "../context/wallet"
import { getWalletAddress } from "../cardano/wallet"
import {
  GOV_TOKEN_NAME_HEX,
  GOV_TOKEN_POLICY_ID,
  GOV_TOKEN_SYMBOL,
} from "../cardano/config"
import ConnectButton from "../components/ConnectButton"
import { getStakedAmount } from "./Stake"
import { StakingPosition } from "../api/model/staking"
import { toast } from "../components/ToastContainer"

const COLORS = [
  "#d62728",
  "#2ca02c",
  "#1f77b4",
  "#ff7f0e",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#7f7f7f",
  "#bcbd22",
  "#17becf",
]

const getIconForType = (type: string) => {
  switch (type) {
    case "GovStateUpdate":
      return <TiDocument />
    case "LicenseRelease":
      return <TiKey />
    case "PoolUpgrade":
      return <TiCog />
    case "FundPayout":
      return <FaDollarSign />
    default:
      return <FaThumbsUp />
  }
}

const ProposalDetail: React.FC<{ proposal?: Proposal }> = ({ proposal }) => {
  const infoBgColor = useColorModeValue("gray.100", "gray.600")
  const detailBg = useColorModeValue(
    "backgroundSecondary.light",
    "backgroundSecondary.dark",
  )
  const textColor = useColorModeValue("text.light", "text.dark")
  const typeColor = useColorModeValue("gray.500", "gray.400")
  const borderColor = useColorModeValue("gray.200", "gray.600")
  const statusColor = useColorModeValue("textSubtle.light", "textSubtle.dark")
  const statusBaseColor =
    proposal?.status === "open" ? "greens.500" : "greys.500"
  const statusBgColor = useColorModeValue(
    `${statusBaseColor}.light`,
    `${statusBaseColor}.dark`,
  )

  const { isConnected } = useWalletContext()
  const [walletAddressHex, setWalletAddressHex] = useState<string | null>(null)

  useEffect(() => {
    const fetchWalletAddress = async () => {
      try {
        let address = await getWalletAddress()
        setWalletAddressHex((prevAddress) =>
          prevAddress !== address ? address : prevAddress,
        )
      } catch (error) {
        console.error("Failed to fetch wallet address", error)
      }
    }
    if (isConnected) {
      fetchWalletAddress()
    }
  }, [isConnected])

  const [
    fetchFn,
    { isLoading: isStakingLoading, isUninitialized: isStakingUninitialized },
  ] = useLazyGetStakingPositionsQuery()

  const [stakingPositions, setStakingPositions] = useState<StakingPosition[]>(
    [],
  )
  const [selectedStakeId, setSelectedStakeId] = useState<number>()
  const [selection, setSelection] = useState("")

  useEffect(() => {
    if (isConnected && walletAddressHex) {
      fetchFn({ wallet: walletAddressHex }).then(({ data: resData }) => {
        if (resData != null) {
          const d = [...resData]
          d.sort(function (a, b) {
            return a.transaction_hash.localeCompare(b.transaction_hash)
          })

          if (!d.length) {
            toast({
              title: "No Staking Positions found",
              description: `Before you can vote, you need to stake some ${GOV_TOKEN_SYMBOL} first`,
              status: "error",
              duration: 5000,
              isClosable: true,
            })

            return
          }

          if (proposal != undefined) {
            // Find first free position and use that for our initial value
            const di = d.findIndex(
              (s) =>
                s.participations.findIndex(
                  (x) => x.proposal_id.toString() === proposal.id.toString(),
                ) === -1 &&
                s.delegated_actions.findIndex(
                  (x) =>
                    x.participation.proposal_id.toString() ===
                    proposal.id.toString(),
                ) === -1,
            )

            if (di === -1) {
              toast({
                title: "No Open Staking Position found",
                description: `All your staking positions are currently in use. You will have to wait until they are unlocked again or create new staking positions`,
                status: "warning",
                duration: 5000,
                isClosable: true,
              })
              setStakingPositions(d)
              return
            }

            setStakingPositions(d)
            setSelectedStakeId(di)
          }
        }
      })
    }
  }, [walletAddressHex, isConnected])

  const handleOnClick = async () => {
    try {
      if (
        stakingPositions == undefined ||
        !stakingPositions.length ||
        selectedStakeId == undefined ||
        proposal == undefined
      )
        return

      const tokenAmountOutput = stakingPositions[selectedStakeId].funds.find(
        (x) =>
          x.policy_id === GOV_TOKEN_POLICY_ID &&
          x.asset_name === GOV_TOKEN_NAME_HEX,
      )
      let tokenAmount = "0"

      if (tokenAmountOutput) tokenAmount = tokenAmountOutput.amount

      // TODO: adjust vote and voting power
      await mintAddVotePermission(
        stakingPositions[selectedStakeId].funds.map((x) => {
          return {
            unit: x.policy_id === "" ? "lovelace" : x.policy_id + x.asset_name,
            quantity: Number(x.amount),
          }
        }),
        stakingPositions[selectedStakeId].transaction_hash,
        stakingPositions[selectedStakeId].output_index.toString(),
        tokenAmount,
        proposal.id.toString(),
        proposal.endDatePosix.toString(),
        selection,
        stakingPositions[selectedStakeId].participations.length > 0
          ? stakingPositions[selectedStakeId].participations
          : undefined,
      )
    } catch (error) {
      console.error("Vote transaction failed", error)
    } finally {
    }
  }

  if (!proposal) {
    return <Text color={textColor}>Proposal not found</Text>
  }

  return (
    <Flex flexDir="row" gap="1em">
      <Box
        bg={detailBg}
        p={8}
        borderRadius="md"
        boxShadow="md"
        w="100%"
        maxW="70%"
      >
        <Flex mb={4} justify={"space-between"}>
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
        <Text whiteSpace={"pre-line"} color={textColor}>
          {proposal.description}
        </Text>

        {proposal.votes.map((v, idx) => (
          <Box
            key={`${idx}-${v.title}`}
            borderWidth="1px"
            borderRadius="lg"
            borderColor={borderColor}
            p={4}
            mt="1em"
          >
            <Flex mb={4} justify={"space-between"}>
              <Heading size="md" color={textColor}>
                <span style={{ fontWeight: "100" }}>{idx + 1}.</span> {v.title}
              </Heading>
              <Tag my="auto" height="min-content" gap="8px">
                {getIconForType(v.type)}
                <Text color={typeColor}>{v.type ?? "Opinion"}</Text>
              </Tag>
            </Flex>
            <Text> {v.description} </Text>

            <VotesBarChart
              votes={[
                {
                  weight: v.weight,
                  color: COLORS[idx],
                  title: <Text>{formatNumber(v.weight, 0)} Votes</Text>,
                },
              ]}
              height="28px"
              quorum={proposal.quorum}
            />
          </Box>
        ))}
      </Box>

      <Flex flexDir="column" minW="20em" w="30%" rowGap="1em">
        <Flex
          flexDir="column"
          bg={detailBg}
          p={8}
          borderRadius="md"
          boxShadow="md"
          h="fit-content"
          rowGap={2}
        >
          <Heading color={textColor}>Information</Heading>
          <Text>{proposal.summary}</Text>
          <Flex justify="space-between">
            <Text color={statusColor}>Creator</Text>
            <Text>{proposal.creatorName}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text color={statusColor}>End Date</Text>
            <Text>{new Date(proposal.endDate).toLocaleString()}</Text>
          </Flex>

          <Box>
            <Text color={statusColor} mb={2}>
              Vote Allocation
            </Text>
            <ProposalBarChart
              proposal={proposal}
              colors={COLORS}
              height="5px"
              hideQuorumText
            />
          </Box>
        </Flex>
        {proposal.status === "open" && (
          <Flex
            flexDir="column"
            bg={detailBg}
            p={8}
            borderRadius="md"
            boxShadow="md"
            h="fit-content"
            rowGap={2}
          >
            <Heading color={textColor}>Vote Now</Heading>

            <Box
              bg={infoBgColor}
              px={2}
              py={4}
              mx={-2}
              borderRadius="md"
              textAlign="left"
              mb={"1em"}
            >
              If you want to reject the proposal you need to actively
              participate in the vote{" "}
            </Box>

            <Text mb="5px">Voting Outcomes:</Text>

            <RadioGroup onChange={setSelection} value={selection} mb="10px">
              <Stack direction="column">
                {proposal.votes.map((v, i) => {
                  return (
                    <Radio key={v.title + i} value={i.toString()}>
                      {i + 1}. <b>{v.title}</b>
                    </Radio>
                  )
                })}
              </Stack>
            </RadioGroup>

            {!isConnected ? (
              <ConnectButton longName />
            ) : (
              <>
                {/* Stake Selector to support multiple votes during the same time frame */}
                <Menu>
                  <MenuButton
                    as={Button}
                    rightIcon={<ChevronDownIcon />}
                    variant="outline"
                  >
                    Selected Stake:{" "}
                    {selectedStakeId == null
                      ? "-"
                      : `${getStakedAmount(stakingPositions[selectedStakeId].funds)} ${GOV_TOKEN_SYMBOL}`}
                  </MenuButton>
                  <MenuList>
                    {stakingPositions.map((v, i) => {
                      const alreadyVoted =
                        v.participations.findIndex(
                          (x) => x.proposal_id === proposal.id.toString(),
                        ) !== -1 ||
                        v.delegated_actions.findIndex(
                          (x) =>
                            x.participation.proposal_id.toString() ===
                            proposal.id.toString(),
                        ) !== -1

                      return (
                        <MenuItem
                          key={v.transaction_hash}
                          onClick={() => setSelectedStakeId(i)}
                          disabled={alreadyVoted}
                          isDisabled={alreadyVoted}
                        >
                          <Flex justify="space-between" align="center" w="full">
                            {getStakedAmount(v.funds)} {GOV_TOKEN_SYMBOL}{" "}
                            {alreadyVoted && " (already voted)"}{" "}
                            {selectedStakeId === i && <CheckIcon />}
                          </Flex>
                        </MenuItem>
                      )
                    })}
                    <Divider my="2px" />
                    <MenuItem
                      onClick={() => {
                        window.location.pathname = "/stake"
                      }}
                    >
                      <Flex
                        justify="space-between"
                        align="center"
                        w="full"
                        opacity={0.8}
                      >
                        Stake more <PlusSquareIcon />
                      </Flex>
                    </MenuItem>
                  </MenuList>
                </Menu>

                <Button
                  onClick={handleOnClick}
                  bg={selection === "0" ? "red" : "green"}
                  isDisabled={
                    selection === "" ||
                    isStakingUninitialized ||
                    isStakingLoading ||
                    selectedStakeId == null
                  }
                  _hover={{
                    bg: selection === "0" ? "red" : "green", // Keep the same color on hover
                  }}
                  sx={{
                    "&:disabled": {
                      _hover: {
                        bg: selection === "0" ? "red" : "green", // Ensure hover color remains the same even when disabled
                      },
                    },
                  }}
                >
                  {selection === "0" ? "Reject Proposal" : "Accept Selection"}
                </Button>
              </>
            )}
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}

const ProposalDetailPage: React.FC = () => {
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
      <Link to={`/proposals`}>
        <Button
          leftIcon={<IoArrowBack />}
          bg={buttonBg}
          _hover={{ bg: buttonHoverBg }}
          color="white"
        >
          Proposals
        </Button>
      </Link>
      <ProposalDetail proposal={proposal?.at(0)} />
    </Flex>
  )
}

export default ProposalDetailPage
