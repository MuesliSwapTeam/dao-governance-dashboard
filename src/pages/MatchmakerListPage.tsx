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
  Grid,
  GridItem,
  IconButton,
} from "@chakra-ui/react"
import { useGetTalliesQuery } from "../api/tallyApi"
import { useMemo } from "react"
import { Link } from "react-router-dom"
import { TiPlus } from "react-icons/ti"
import { MdSwapHoriz } from "react-icons/md"

import { Proposal } from "../api/model/tally"
import VoteRatioBar from "../components/VoteRatioBar"
import { FaShareAlt, FaShareAltSquare } from "react-icons/fa"
import { FaShareNodes } from "react-icons/fa6"
import {
  isLicenseReleaseProposal,
  parseLicenseReleaseArgs,
} from "../utils/proposals"

const MatchmakerList: React.FC<{ proposals: Proposal[] }> = ({ proposals }) => {
  const textColor = useColorModeValue("text.light", "text.dark")
  const cardBg = useColorModeValue("white", "gray.800")
  const cardBorderColor = useColorModeValue("gray.200", "gray.700")
  const greenColor = useColorModeValue("greens.400.light", "greens.400.dark")
  const redColor = useColorModeValue("reds.default.light", "reds.default.dark")

  return (
    <Flex flexDir="column" rowGap="1em">
      {proposals.length === 0 ? (
        <Alert status="info">
          <AlertIcon />
          No licenses found.
        </Alert>
      ) : (
        proposals.map((proposal) => {
          const licenseArgs = parseLicenseReleaseArgs(proposal)
          return (
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
              <Text mt="2" color={textColor}>
                {proposal.summary}
              </Text>
              <Flex gap="1em" justify="space-between" align="center">
                <Heading size="sm">Wallet Address: </Heading>
                <Flex align={"center"}>
                  <Text>{licenseArgs.address}</Text>
                  {/* TODO pjordan: Figure out how to make margins smaller */}
                  <IconButton
                    size="md"
                    variant="skeleton"
                    aria-label="Show on cardanoscan"
                    icon={<FaShareAltSquare />}
                    onClick={() =>
                      window.open(
                        `https://cardanoscan.io/address/${licenseArgs}`,
                        "_blank",
                      )
                    }
                  />
                  <IconButton
                    size="md"
                    variant="skeleton"
                    aria-label="Show on cexplorer"
                    icon={<FaShareNodes />}
                    onClick={() =>
                      window.open(
                        `https://cardanoscan.io/address/${licenseArgs}`,
                        "_blank",
                      )
                    }
                  />
                  <IconButton
                    size="md"
                    variant="skeleton"
                    aria-label="Show on taptools"
                    icon={<FaShareAlt />}
                    onClick={() =>
                      window.open(
                        `https://cardanoscan.io/address/${licenseArgs}`,
                        "_blank",
                      )
                    }
                  />
                </Flex>
              </Flex>
              <Grid templateColumns={"auto 1fr"} rowGap="2px" columnGap="1em">
                <GridItem alignContent="center">
                  <Heading size="sm"> Approve&nbsp;Votes: </Heading>
                </GridItem>
                <GridItem>
                  <VoteRatioBar
                    votes={licenseArgs.approveWeight}
                    total={proposal.quorum}
                    color={greenColor}
                  />
                </GridItem>
                <GridItem alignContent="center">
                  <Heading size="sm"> Revoke&nbsp;Votes: </Heading>
                </GridItem>
                <GridItem>
                  <VoteRatioBar
                    votes={licenseArgs.revokeWeight}
                    total={proposal.quorum}
                    color={redColor}
                  />
                </GridItem>
              </Grid>
              <Flex mt="4" justify="space-between" align="center">
                <Link
                  to={`/matchmakers/${proposal.authNft.policyId}.${proposal.authNft.name}/${proposal.id}`}
                >
                  <Button size="sm">View Details</Button>
                </Link>
                <HStack spacing="2">
                  <Text color={textColor}>
                    Latest Expiry Date:{" "}
                    {new Date(licenseArgs.endDate).toLocaleString()}
                  </Text>
                </HStack>
              </Flex>
            </Box>
          )
        })
      )}
    </Flex>
  )
}

const MatchmakerListPage: React.FC = () => {
  // NOTE pjordan: We should add a filter for licenses to the BE
  const {
    data: tallies = [],
    isLoading,
    error,
  } = useGetTalliesQuery({ open: true, closed: true })

  const [currentLicenses, terminatedLicenses] = useMemo(() => {
    const filteredTallies = tallies.filter(isLicenseReleaseProposal)
    return filteredTallies.reduce<[Proposal[], Proposal[]]>(
      (acc, item) => {
        if (item.status === "open") acc[0].push(item)
        else acc[1].push(item)
        return acc
      },
      [[], []],
    )
  }, [tallies])

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
          <MdSwapHoriz size="32px" style={{ marginRight: "8px" }} />
          Matchmaker Licenses
        </Heading>
        {/* TODO pjordan: Add this */}
        <Link to={`/matchmakers/create`}>
          <Button
            leftIcon={<TiPlus />}
            bg={buttonBg}
            _hover={{ bg: buttonHoverBg }}
            color="white"
          >
            Request License
          </Button>
        </Link>
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
        <Tabs variant="line">
          <Flex flexDir="row" justify="space-between" align="center" mx="16px">
            <TabList>
              <Tab
                borderRadius="6px"
                _selected={{ color: "white", bg: "green.500" }}
              >
                Current Licenses
              </Tab>
              <Tab
                borderRadius="6px"
                _selected={{ color: "white", bg: "red.500" }}
              >
                Terminated Licenses
              </Tab>
            </TabList>
          </Flex>
          <TabPanels>
            <TabPanel>
              <MatchmakerList proposals={currentLicenses} />
            </TabPanel>
            <TabPanel>
              <MatchmakerList proposals={terminatedLicenses} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}
    </Box>
  )
}

export default MatchmakerListPage
