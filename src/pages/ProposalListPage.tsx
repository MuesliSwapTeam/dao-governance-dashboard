import {
  Box,
  Button,
  Flex,
  Heading,
  useColorModeValue,
  Badge,
  Text,
  HStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Alert,
  AlertIcon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  MenuOptionGroup,
  MenuItemOption,
} from "@chakra-ui/react"
import { useGetTalliesQuery } from "../api/tallyApi"
import { Fragment, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { TiPlus, TiDocument, TiKey, TiCog } from "react-icons/ti"
import { FaDollarSign, FaThumbsUp } from "react-icons/fa"
import { ChevronDownIcon } from "@chakra-ui/icons"
import { Proposal, VoteType } from "../api/model/tally"
import VoteRatioBar from "../components/VoteRatioBar"

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

const ProposalList: React.FC<{ proposals: Proposal[] }> = ({ proposals }) => {
  const textColor = useColorModeValue("text.light", "text.dark")
  const typeColor = useColorModeValue("gray.500", "gray.400")
  const cardBg = useColorModeValue("white", "gray.800")
  const cardBorderColor = useColorModeValue("gray.200", "gray.700")

  return (
    <Flex flexDir="column" rowGap="1em">
      {proposals.length === 0 ? (
        <Alert status="info">
          <AlertIcon />
          There are currently no proposals.
        </Alert>
      ) : (
        proposals.map((proposal) => (
          <Box
            key={proposal.output.hash + proposal.output.index}
            p="16px"
            bg={cardBg}
            borderRadius="md"
            boxShadow="md"
            border={`1px solid ${cardBorderColor}`}
            _hover={{ boxShadow: "lg" }}
          >
            <Flex justify="space-between" align="center">
              <Heading as="h3" size="md" color={textColor}>
                {proposal.title}
              </Heading>
              <Badge
                colorScheme={proposal.status === "closed" ? "red" : "green"}
                px="2"
                py="1"
                borderRadius="md"
              >
                {proposal.status}
              </Badge>
            </Flex>
            <HStack mt="1" spacing="2" align="center">
              {proposal.voteTypes.map((t) => (
                <Fragment key={t}>
                  {getIconForType(t)}
                  <Text color={typeColor}>{t}</Text>
                </Fragment>
              ))}
            </HStack>
            <Text mt="2" color={textColor}>
              {proposal.summary}
            </Text>
            <VoteRatioBar
              votes={proposal.totalWeight}
              total={proposal.quorum}
            />
            <Flex mt="4" justify="space-between" align="center">
              <Link
                to={`/proposals/${proposal.authNft.policyId}.${proposal.authNft.name}/${proposal.id}`}
              >
                <Button size="sm">View Details</Button>
              </Link>
              <HStack spacing="2">
                <Text color={textColor}>
                  End Date: {new Date(proposal.endDate).toLocaleString()}
                </Text>
              </HStack>
            </Flex>
          </Box>
        ))
      )}
    </Flex>
  )
}

const ProposalListPage: React.FC = () => {
  const {
    data: tallies = [],
    isLoading,
    error,
  } = useGetTalliesQuery({ open: true, closed: true })
  const [selectedTypes, setSelectedTypes] = useState<VoteType[]>([])

  const [filteredOpenProposals, filteredClosedProposals] = useMemo(() => {
    const filteredTallies = !selectedTypes.length
      ? tallies
      : tallies.filter((p) => {
          const s = new Set(p.voteTypes)
          return selectedTypes.some((item) => s.has(item))
        })
    return filteredTallies.reduce<[Proposal[], Proposal[]]>(
      (acc, item) => {
        if (item.status === "open") acc[0].push(item)
        else acc[1].push(item)
        return acc
      },
      [[], []],
    )
  }, [selectedTypes, tallies])

  const textColor = useColorModeValue("text.light", "text.dark")
  const buttonBg = useColorModeValue("accent.light", "accent.dark")
  const buttonHoverBg = useColorModeValue(
    "accentPressed.light",
    "accentPressed.dark",
  )

  return (
    <Box m="24px 16px" sx={{ textAlign: "start" }}>
      <Flex justify="space-between" align="center" p="16px" mb="48px">
        <Heading display="flex" alignItems="center" color={textColor}>
          <TiDocument size="32px" style={{ marginRight: "8px" }} />
          Proposals
        </Heading>
        <Link to={`/proposals/create`}>
          <Button
            leftIcon={<TiPlus />}
            bg={buttonBg}
            _hover={{ bg: buttonHoverBg }}
            color="white"
          >
            Propose Idea
          </Button>
        </Link>
        {/* TODO pjordan: Add button "Show Governance Thread", 
                            which opens a small status modal/view of the current governance thread 
                            and some information about it 

              It should show at least following information:
               - min_quorum, min_winning_threshhold, min_proposal_duration
               - latest_applied_proposal_id

              Additionally we could also show:
               - gov_state_nft, governance_token,
               - vault_ft_policy_id
               - tally_address, tally_auth_nft
               - staking_address, staking_vote_nft_policy
          */}
      </Flex>
      {isLoading ? (
        <Flex justify="center" align="center" height="100vh">
          <Spinner size="xl" />
        </Flex>
      ) : error ? (
        <Alert status="error">
          <AlertIcon />
          There was an error loading the proposals.
        </Alert>
      ) : (
        <Tabs variant="line">
          <Flex flexDir="row" justify="space-between" align="center" mx="16px">
            <TabList>
              <Tab
                borderRadius="6px"
                border="1px solid grey"
                mr="4px"
                _selected={{ color: "white", bg: "green.500" }}
              >
                Open Proposals
              </Tab>
              {/*<Tab
                borderRadius="6px"
                border="1px solid grey"
                _selected={{ color: "white", bg: "red.500" }}
              >
                Closed Proposals
              </Tab>*/}
            </TabList>
            <Menu>
              <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                Filter
              </MenuButton>
              <MenuList>
                <MenuOptionGroup
                  value={selectedTypes}
                  title="Type"
                  type="checkbox"
                  onChange={(v) => setSelectedTypes(v as VoteType[])}
                >
                  <MenuItemOption value="Opinion" icon={<FaThumbsUp />}>
                    Opinion
                  </MenuItemOption>
                  <MenuItemOption value="GovStateUpdate" icon={<TiDocument />}>
                    GovStateUpdate
                  </MenuItemOption>
                  <MenuItemOption value="FundPayout" icon={<FaDollarSign />}>
                    FundPayout
                  </MenuItemOption>
                  <MenuItemOption value="PoolUpgrade" icon={<TiCog />}>
                    PoolUpgrade
                  </MenuItemOption>
                </MenuOptionGroup>
                <MenuDivider />
                <MenuItem onClick={() => setSelectedTypes([])}>
                  Clear Filter
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>
          <TabPanels>
            <TabPanel>
              <ProposalList proposals={filteredOpenProposals} />
            </TabPanel>
            <TabPanel>
              <ProposalList proposals={filteredClosedProposals} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}
    </Box>
  )
}

export default ProposalListPage
