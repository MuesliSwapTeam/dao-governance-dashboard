import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Flex,
  Spacer,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Image,
  useColorModeValue,
} from "@chakra-ui/react"
import PieChart from "../components/Treasury/PieChart" // Adjust the path as necessary
import LineChart from "../components/Treasury/LineChart" // Adjust the path as necessary
import { LiaCoinsSolid } from "react-icons/lia"
import HistoryCard from "../components/Treasury/HistoryCard"
import OpenProposalsCard from "../components/Treasury/OpenProposalsCard"
import {
  useGetTreasuryFundsQuery,
  useGetTreasuryHistoryQuery,
  useGetTreasuryChartQuery,
} from "../api/treasuryApi"
import { useMemo } from "react"
import { fromNativeAmount, formatNumberFixed } from "../utils/numericHelpers"
import { useGetTalliesQuery } from "../api/tallyApi"

const Treasury: React.FC = () => {
  const accentColor = useColorModeValue("accent.light", "accent.dark")
  const bgColor = useColorModeValue(
    "backgroundSecondary.light",
    "backgroundSecondary.dark",
  )
  const textSbColor = useColorModeValue("textSubtle.light", "textSubtle.dark")
  const textColor = useColorModeValue("text.light", "text.dark")
  const accentHeadingColor = useColorModeValue("purple.600", "purple.400")

  const {
    data: treasuryAssets,
    isLoading: fundsIsLoading,
    isUninitialized: fundsIsUninitialized,
  } = useGetTreasuryFundsQuery()
  const {
    data: history,
    isLoading: historyIsLoading,
    isUninitialized: historyIsUninitialized,
  } = useGetTreasuryHistoryQuery()
  const {
    data: chartData,
    isLoading: chartIsLoading,
    isUninitialized: chartIsUninitialized,
  } = useGetTreasuryChartQuery()

  const {
    data: openTallies,
    isLoading: talliesIsLoading,
    isUninitialized: talliesIsUninitialized,
  } = useGetTalliesQuery({ open: true, closed: false })

  const transactions = useMemo(() => {
    if (historyIsLoading || historyIsUninitialized || !history) return []

    return history
      .filter(({ action }) => action !== "consolidate")
      .map(({ transaction_hash, delta, action, timestamp }) => {
        // TODO : Figure out payout field and add support to link to daoDecision
        return {
          type: action.charAt(0).toUpperCase() + action.substring(1),
          amounts: delta,
          date: timestamp,
          txHash: transaction_hash,
          reason: "",
          breakdown: "",
          daoDecision: undefined,
        }
      })
  }, [historyIsLoading, historyIsUninitialized, history])

  const [totalAssets, assets] = useMemo(() => {
    if (fundsIsLoading || fundsIsUninitialized || !treasuryAssets)
      return [0, []]

    const total = treasuryAssets.reduce((p, c) => p + Number(c.eqAmountLvl), 0)

    const assetList = treasuryAssets.map((v) => ({
      name: v.symbol,
      valueAda: fromNativeAmount(v.eqAmountLvl, 6).toString(),
      value: fromNativeAmount(v.amount, v.decimalPlaces).toString(),
      share: Number(v.eqAmountLvl) / total,
      logo: v.image,
    }))

    return [total, assetList]
  }, [fundsIsLoading, fundsIsUninitialized, treasuryAssets])

  // TODO : Add loading screen
  if (
    fundsIsLoading ||
    fundsIsUninitialized ||
    treasuryAssets === undefined ||
    historyIsLoading ||
    historyIsUninitialized ||
    history === undefined ||
    chartIsLoading ||
    chartIsUninitialized ||
    chartData === undefined ||
    talliesIsLoading ||
    talliesIsUninitialized ||
    openTallies === undefined
  )
    return undefined

  return (
    <Box m="24px 16px" sx={{ textAlign: "start" }}>
      <Flex justify="space-between" align="center" p="16px" mb="1em">
        <Heading display="flex" alignItems="center" color={textColor}>
          <LiaCoinsSolid size="32px" style={{ marginRight: "8px" }} />
          Treasury
        </Heading>
      </Flex>

      {/* Total Assets Box */}
      <Flex
        flexDir="row"
        bg={bgColor}
        p={6}
        borderRadius="lg"
        boxShadow="lg"
        mb={6}
      >
        <Box>
          <Text fontSize="sm" color={textSbColor} mb={0}>
            DAO Treasury
          </Text>
          <Heading as="h2" size="xl" mt={1} mb={2}>
            Total Assets
          </Heading>
          <Text fontSize="md" color={textSbColor}>
            Assets held in DAO Treasury
          </Text>
        </Box>
        <Spacer />
        <Box>
          <Text fontSize="4xl" color={accentHeadingColor} fontWeight="bold">
            {formatNumberFixed(fromNativeAmount(totalAssets, 6), 2)} ADA
          </Text>
          <Text fontSize="2xl" color={textSbColor}>
            $- {/* TODO : Add this */}
          </Text>
        </Box>
      </Flex>

      <Tabs variant="line" mt={6}>
        <TabList borderBottom="0px">
          <Tab
            borderRadius="6px"
            border="1px solid grey"
            mr="4px"
            _selected={{ color: "white", bg: accentColor }}
          >
            Treasury Transactions
          </Tab>
          <Tab
            borderRadius="6px"
            border="1px solid grey"
            mr="4px"
            _selected={{ color: "white", bg: accentColor }}
          >
            Asset Breakdown
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel display="flex" flexDir="column" rowGap="6">
            <HistoryCard transactions={transactions} />
            <OpenProposalsCard proposals={openTallies} />
          </TabPanel>

          <TabPanel>
            <SimpleGrid
              height="fit-content"
              columns={{ base: 1, md: 2 }}
              spacing={6}
            >
              <PieChart assets={treasuryAssets} />
              <LineChart assetHistory={chartData} />
            </SimpleGrid>

            <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="lg" mt={6}>
              <Heading as="h3" size="md" mb="4">
                Detailed Asset Breakdown
              </Heading>
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Token</Th>
                      <Th>Amount</Th>
                      <Th>Current Value</Th>
                      <Th>Share (%)</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {assets.map((asset, index) => (
                      <Tr key={index}>
                        <Td>
                          <Flex align="center">
                            <Image
                              src={asset.logo}
                              alt={`${asset.name} logo`}
                              boxSize="20px"
                              mr={2}
                            />
                            {asset.name}
                          </Flex>
                        </Td>
                        <Td>
                          {asset.value} {asset.name}
                        </Td>
                        <Td>{asset.valueAda} ADA</Td>
                        <Td>{(100 * asset.share).toFixed(2)}%</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  )
}

export default Treasury
