import { useParams, Link } from "react-router-dom"
import {
  Box,
  Heading,
  Text,
  Flex,
  useColorModeValue,
  Button,
  Grid,
  Spinner,
  Alert,
  AlertIcon,
  Link as ChakraLink,
  Image as ChakraImage,
  IconButton,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Tooltip,
  Select,
  HStack,
} from "@chakra-ui/react"
import { IoArrowBack } from "react-icons/io5"
import { CopyIcon, ChevronUpIcon, ChevronDownIcon } from "@chakra-ui/icons"
import React, { useState, useMemo, useCallback } from "react"

import cardanoScanLogo from "../assets/cardanoscan-favicon-32x32.png"
import cexplorerLogo from "../assets/cexplorer-favicon.svg"
import taptoolsLogo from "../assets/taptools-favicon.png"
import { useGetBatcherStatsQuery, useGetBatcherTransactionsQuery } from "../api/monitoringApi"
import { formatNumber } from "../utils/numericHelpers"

type SortColumn = 'tx_hash' | 'ada_profit' | 'non_ada_profit' | 'total_profit' | 'original'
type SortDirection = 'asc' | 'desc'

// Memoized Transaction Row Component for performance
const TransactionRow = React.memo<{
  transaction: any
  textColor: string
  onCopyHash: (hash: string) => void
  formatProfit: (profit: number) => string
  formatNonAdaProfit: (profit: number, otherAssets: Record<string, any>) => { display: string; fullAssets: string }
  getProfitColor: (profit: number) => string
}>(({ transaction, textColor, onCopyHash, formatProfit, formatNonAdaProfit, getProfitColor }) => {
  const totalProfit = transaction.ada_profit + transaction.non_ada_profit
  const nonAdaDisplay = formatNonAdaProfit(transaction.non_ada_profit, transaction.other_assets)

  return (
    <Tr>
      <Td>
        <Text 
          fontFamily="mono" 
          fontSize="sm"
          color={textColor}
          cursor="pointer"
          _hover={{ color: "blue.500", textDecoration: "underline" }}
          onClick={() => onCopyHash(transaction.tx_hash)}
          title={transaction.tx_hash}
        >
          {`${transaction.tx_hash.slice(0, 8)}...${transaction.tx_hash.slice(-8)}`}
        </Text>
      </Td>
      <Td isNumeric>
        <Text 
          color={getProfitColor(transaction.ada_profit)}
          fontWeight="medium"
        >
          {formatProfit(transaction.ada_profit)}
        </Text>
      </Td>
      <Td isNumeric>
        {nonAdaDisplay.fullAssets ? (
          <Tooltip label={nonAdaDisplay.fullAssets} placement="top">
            <Text 
              color={getProfitColor(transaction.non_ada_profit)}
              fontWeight="medium"
              cursor="help"
            >
              {nonAdaDisplay.display}
            </Text>
          </Tooltip>
        ) : (
          <Text 
            color={getProfitColor(transaction.non_ada_profit)}
            fontWeight="medium"
          >
            {nonAdaDisplay.display}
          </Text>
        )}
      </Td>
      <Td isNumeric>
        <Text 
          color={getProfitColor(totalProfit)}
          fontWeight="bold"
        >
          {formatProfit(totalProfit)}
        </Text>
      </Td>
      <Td>
        <Flex gap="2">
          <ChakraLink
            href={`https://cardanoscan.io/transaction/${transaction.tx_hash}`}
            isExternal
            aria-label="View on Cardanoscan"
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
            href={`https://cexplorer.io/tx/${transaction.tx_hash}`}
            isExternal
            aria-label="View on Cexplorer"
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
          <IconButton
            icon={<CopyIcon />}
            aria-label="Copy transaction hash"
            onClick={() => onCopyHash(transaction.tx_hash)}
            size="sm"
            variant="ghost"
            colorScheme="gray"
          />
        </Flex>
      </Td>
    </Tr>
  )
})

TransactionRow.displayName = 'TransactionRow'

const BatcherDetailPage: React.FC = () => {
  const { address } = useParams<{ address: string }>()
  const toast = useToast()
  
  // Sorting state - default to original API order
  const [sortBy, setSortBy] = useState<SortColumn>('original')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)

  const {
    data: batcherStats,
    isLoading,
    error,
  } = useGetBatcherStatsQuery(address || "", {
    skip: !address,
  })

  // Fetch transactions data
  const {
    data: batcherTransactions,
    isLoading: isTransactionsLoading,
    error: transactionsError,
  } = useGetBatcherTransactionsQuery(address || "", {
    skip: !address,
  })

  const textColor = useColorModeValue("text.light", "text.dark")
  const cardBg = useColorModeValue("white", "gray.800")
  const cardBorderColor = useColorModeValue("gray.200", "gray.700")
  const buttonBg = useColorModeValue("accent.light", "accent.dark")
  const buttonHoverBg = useColorModeValue("accentPressed.light", "accentPressed.dark")

  // Format processing time (convert from milliseconds to seconds)
  const formatProcessingTime = (milliseconds: number) => {
    const seconds = milliseconds / 1000
    return `${seconds.toFixed(3)} s`
  }

  // Format profit values
  const formatProfit = (profit: number) => {
    if (profit >= 0) {
      return `+${formatNumber(profit / 1_000_000, 2)} ADA`
    }
    return `${formatNumber(profit / 1_000_000, 2)} ADA`
  }

  // Format non-ADA profit with asset information
  const formatNonAdaProfit = (profit: number, otherAssets: Record<string, any>) => {
    const assetNames = Object.keys(otherAssets)
    
    if (profit === 0 && assetNames.length === 0) {
      return { display: "0", fullAssets: "" }
    }
    
    if (assetNames.length > 0) {
      // Truncate long asset names (likely policy IDs) for better display
      const truncatedNames = assetNames.map(name => {
        if (name.length > 12) {
          return `${name.slice(0, 6)}...${name.slice(-4)}`
        }
        return name
      })
      const assetList = truncatedNames.join(", ")
      const fullAssetList = assetNames.join(", ")
      
      if (profit === 0) {
        return { display: `0 (${assetList})`, fullAssets: `Full assets: ${fullAssetList}` }
      }
      return { 
        display: `${formatNumber(profit, 6)} (${assetList})`,
        fullAssets: `${formatNumber(profit, 6)} (${fullAssetList})`
      }
    }
    
    return { display: formatNumber(profit, 6), fullAssets: "" }
  }

  // Get color for profit values
  const getProfitColor = (profit: number) => {
    if (profit > 0) return "green.500"
    if (profit < 0) return "red.500"
    return textColor
  }

  // Memoized callback for copying hash
  const handleCopyHash = useCallback((hash: string) => {
    navigator.clipboard.writeText(hash)
    toast({
      title: "Transaction hash copied!",
      description: "The full transaction hash has been copied to your clipboard.",
      status: "success",
      duration: 2000,
      isClosable: true,
    })
  }, [toast])

  // Sorting functions
  const handleSort = (column: SortColumn) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDirection(column === 'tx_hash' ? 'asc' : 'desc') // Default to desc for numeric columns
    }
  }

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    if (!batcherTransactions) return []
    
    // Return original order if 'original' is selected
    if (sortBy === 'original') {
      return [...batcherTransactions]
    }
    
    return [...batcherTransactions].sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortBy) {
        case 'tx_hash':
          aValue = a.tx_hash
          bValue = b.tx_hash
          break
        case 'ada_profit':
          aValue = a.ada_profit
          bValue = b.ada_profit
          break
        case 'non_ada_profit':
          aValue = a.non_ada_profit
          bValue = b.non_ada_profit
          break
        case 'total_profit':
          aValue = a.ada_profit + a.non_ada_profit
          bValue = b.ada_profit + b.non_ada_profit
          break
        default:
          return 0
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const result = aValue.localeCompare(bValue)
        return sortDirection === 'asc' ? result : -result
      } else {
        const result = (aValue as number) - (bValue as number)
        return sortDirection === 'asc' ? result : -result
      }
    })
  }, [batcherTransactions, sortBy, sortDirection])

  // Get sort icon
  const getSortIcon = (column: SortColumn) => {
    if (sortBy !== column) return null
    return sortDirection === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />
  }

  // Pagination logic
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage)
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return sortedTransactions.slice(startIndex, endIndex)
  }, [sortedTransactions, currentPage, itemsPerPage])

  // Reset to first page when sorting changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [sortBy, sortDirection])

  if (!address) {
    return (
      <Box m="24px 16px" textAlign="center">
        <Alert status="error">
          <AlertIcon />
          No batcher address provided
        </Alert>
      </Box>
    )
  }

  return (
    <Box m="24px 16px" mb="48px" sx={{ textAlign: "start" }}>
      {/* Back Button */}
      <Link to="/matchmakers?tab=monitoring">
        <Button
          leftIcon={<IoArrowBack />}
          bg={buttonBg}
          _hover={{ bg: buttonHoverBg }}
          color="white"
          mb="24px"
        >
          Back to Monitoring
        </Button>
      </Link>

      {/* Header */}
      <Box mb="32px">
        <Heading color={textColor} size="xl" mb="4">
          Batcher Details
        </Heading>
        
        {/* Address Section */}
        <Box
          p="4"
          bg={cardBg}
          borderRadius="lg"
          border={`1px solid ${cardBorderColor}`}
        >
          <Text fontSize="xs" color="gray.500" fontWeight="medium" mb="2">
            BATCHER ADDRESS
          </Text>
          <Flex justify="space-between" align="center">
            <Text
              fontSize="md"
              fontFamily="mono"
              color={textColor}
              fontWeight="medium"
            >
              {address}
            </Text>
            <Flex align="center" gap="2">
              {/* Explorer Links */}
              <ChakraLink
                href={`https://cardanoscan.io/address/${address}`}
                isExternal
                aria-label="Show on Cardanoscan"
              >
                <ChakraImage
                  src={cardanoScanLogo}
                  alt="Cardanoscan"
                  boxSize="24px"
                  opacity="0.7"
                  _hover={{ opacity: "1" }}
                  transition="opacity 0.2s"
                />
              </ChakraLink>
              <ChakraLink
                href={`https://cexplorer.io/address/${address}`}
                isExternal
                aria-label="Show on Cexplorer"
              >
                <ChakraImage
                  src={cexplorerLogo}
                  alt="Cexplorer"
                  boxSize="24px"
                  opacity="0.7"
                  _hover={{ opacity: "1" }}
                  transition="opacity 0.2s"
                />
              </ChakraLink>
              <ChakraLink
                href={`https://taptools.io/address/${address}`}
                isExternal
                aria-label="Show on Taptools"
              >
                <ChakraImage
                  src={taptoolsLogo}
                  alt="TapTools"
                  boxSize="24px"
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
                  navigator.clipboard.writeText(address)
                  toast({
                    title: "Address copied!",
                    description: "The batcher address has been copied to your clipboard.",
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
            </Flex>
          </Flex>
        </Box>
      </Box>

      {/* Stats Content */}
      {isLoading ? (
        <Flex justify="center" align="center" height="300px">
          <Spinner size="xl" />
        </Flex>
      ) : error ? (
        <Alert status="error">
          <AlertIcon />
          There was an error loading batcher statistics.
        </Alert>
      ) : batcherStats ? (
        <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap="6">
          {/* Total Transactions */}
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Transactions</StatLabel>
                <StatNumber fontSize="2xl" color={textColor}>
                  {sortedTransactions.length.toLocaleString()}
                </StatNumber>
                <StatHelpText>Processed transactions</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          {/* Total Profit */}
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Profit</StatLabel>
                <StatNumber 
                  color={getProfitColor(batcherStats.total_profit)}
                  fontSize="2xl"
                >
                  {formatProfit(batcherStats.total_profit)}
                </StatNumber>
                <StatHelpText>Lifetime earnings</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          {/* Average Profit */}
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Average Profit</StatLabel>
                <StatNumber 
                  color={getProfitColor(batcherStats.avg_profit)}
                  fontSize="2xl"
                >
                  {formatProfit(batcherStats.avg_profit)}
                </StatNumber>
                <StatHelpText>Per transaction</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          {/* Max Profit */}
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Maximum Profit</StatLabel>
                <StatNumber 
                  color={getProfitColor(batcherStats.max_profit)}
                  fontSize="2xl"
                >
                  {formatProfit(batcherStats.max_profit)}
                </StatNumber>
                <StatHelpText>Best single transaction</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          {/* Min Profit */}
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Minimum Profit</StatLabel>
                <StatNumber 
                  color={getProfitColor(batcherStats.min_profit)}
                  fontSize="2xl"
                >
                  {formatProfit(batcherStats.min_profit)}
                </StatNumber>
                <StatHelpText>Worst single transaction</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          {/* Processing Time */}
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Average Processing Time</StatLabel>
                <StatNumber fontSize="2xl" color={textColor}>
                  {formatProcessingTime(batcherStats.avg_processing_time)}
                </StatNumber>
                <StatHelpText>Per transaction</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          {/* Performance Summary */}
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Performance Status</StatLabel>
                <StatNumber 
                  fontSize="lg" 
                  color={batcherStats.total_profit > 0 ? "green.500" : "red.500"}
                >
                  {batcherStats.total_profit > 0 ? "✓ Following DAO Rules" : "⚠ Violating DAO Rules"}
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </Grid>
      ) : (
        <Alert status="info">
          <AlertIcon />
          No statistics available for this batcher.
        </Alert>
      )}

      {/* Transactions Table */}
      <Box mt="8" marginBottom="10px">
        <Flex justify="space-between" align="center" padding="10px">
          <Heading size="lg" color={textColor}>
            Transaction History
          </Heading>
          <Text fontSize="sm" color="gray.500">
            Click column headers to sort
          </Text>
        </Flex>
        
        {isTransactionsLoading ? (
          <Flex justify="center" align="center" height="200px">
            <Spinner size="xl" />
          </Flex>
        ) : transactionsError ? (
          <Alert status="error">
            <AlertIcon />
            There was an error loading transaction data.
          </Alert>
        ) : sortedTransactions && sortedTransactions.length > 0 ? (
          <Card borderRadius="xl" shadow="lg">
            <CardBody p="0">
              <TableContainer borderRadius="xl" overflow="hidden">
                <Table variant="simple">
                  <Thead bg={useColorModeValue("gray.50", "gray.700")}>
                    <Tr>
                      <Th 
                        cursor="pointer" 
                        onClick={() => handleSort('tx_hash')}
                        _hover={{ bg: useColorModeValue("gray.100", "gray.600") }}
                        transition="background-color 0.2s"
                        userSelect="none"
                      >
                        <Flex align="center" gap="1">
                          Transaction Hash
                          {getSortIcon('tx_hash')}
                        </Flex>
                      </Th>
                      <Th 
                        isNumeric 
                        cursor="pointer" 
                        onClick={() => handleSort('ada_profit')}
                        _hover={{ bg: useColorModeValue("gray.100", "gray.600") }}
                        transition="background-color 0.2s"
                        userSelect="none"
                      >
                        <Flex align="center" gap="1" justify="flex-end">
                          ADA Profit
                          {getSortIcon('ada_profit')}
                        </Flex>
                      </Th>
                      <Th 
                        isNumeric 
                        cursor="pointer" 
                        onClick={() => handleSort('non_ada_profit')}
                        _hover={{ bg: useColorModeValue("gray.100", "gray.600") }}
                        transition="background-color 0.2s"
                        userSelect="none"
                      >
                        <Flex align="center" gap="1" justify="flex-end">
                          Other Assets
                          {getSortIcon('non_ada_profit')}
                        </Flex>
                      </Th>
                      <Th 
                        cursor="pointer" 
                        onClick={() => handleSort('total_profit')}
                        _hover={{ bg: useColorModeValue("gray.100", "gray.600") }}
                        transition="background-color 0.2s"
                        userSelect="none"
                      >
                        <Flex align="center" gap="1">
                          Total Profit
                          {getSortIcon('total_profit')}
                        </Flex>
                      </Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {paginatedTransactions.map((transaction) => {
                      const totalProfit = transaction.ada_profit + transaction.non_ada_profit
                      return (
                        <Tr key={transaction.tx_hash}>
                          <Td>
                            <Text 
                              fontFamily="mono" 
                              fontSize="sm"
                              color={textColor}
                              cursor="pointer"
                              _hover={{ color: "blue.500", textDecoration: "underline" }}
                              onClick={() => handleCopyHash(transaction.tx_hash)}
                              title={transaction.tx_hash}
                            >
                              {`${transaction.tx_hash.slice(0, 8)}...${transaction.tx_hash.slice(-8)}`}
                            </Text>
                          </Td>
                          <Td isNumeric>
                            <Text 
                              color={getProfitColor(transaction.ada_profit)}
                              fontWeight="medium"
                            >
                              {formatProfit(transaction.ada_profit)}
                            </Text>
                          </Td>
                            <Td>
                              {(() => {
                                const nonAdaData = formatNonAdaProfit(transaction.non_ada_profit, transaction.other_assets)
                                return nonAdaData.fullAssets ? (
                                  <Tooltip 
                                    label={nonAdaData.fullAssets}
                                    placement="top"
                                    hasArrow
                                  >
                                    <Text 
                                      color={getProfitColor(transaction.non_ada_profit)}
                                      fontWeight="medium"
                                      fontSize="sm"
                                      textAlign="right"
                                      cursor="help"
                                    >
                                      {nonAdaData.display}
                                    </Text>
                                  </Tooltip>
                                ) : (
                                  <Text 
                                    color={getProfitColor(transaction.non_ada_profit)}
                                    fontWeight="medium"
                                    fontSize="sm"
                                    textAlign="right"
                                  >
                                    {nonAdaData.display}
                                  </Text>
                                )
                              })()}
                            </Td>
                          <Td>
                            <Text 
                              color={getProfitColor(totalProfit)}
                              fontWeight="bold"
                            >
                              {formatProfit(totalProfit)}
                            </Text>
                          </Td>
                          <Td>
                              <Flex gap="3" align="center" justify="center" p="2">
                                <ChakraLink
                                  href={`https://cardanoscan.io/transaction/${transaction.tx_hash}`}
                                  isExternal
                                  aria-label="View on Cardanoscan"
                                  p="2"
                                  borderRadius="md"
                                  _hover={{ 
                                    bg: useColorModeValue("blue.50", "blue.900"),
                                    transform: "translateY(-1px)",
                                    boxShadow: "sm"
                                  }}
                                  transition="all 0.2s"
                                >
                                  <ChakraImage
                                    src={cardanoScanLogo}
                                    alt="Cardanoscan"
                                    boxSize="20px"
                                    opacity="0.8"
                                    _hover={{ opacity: "1" }}
                                    transition="opacity 0.2s"
                                  />
                                </ChakraLink>
                                <ChakraLink
                                  href={`https://cexplorer.io/tx/${transaction.tx_hash}`}
                                  isExternal
                                  aria-label="View on Cexplorer"
                                  p="2"
                                  borderRadius="md"
                                  _hover={{ 
                                    bg: useColorModeValue("purple.50", "purple.900"),
                                    transform: "translateY(-1px)",
                                    boxShadow: "sm"
                                  }}
                                  transition="all 0.2s"
                                >
                                  <ChakraImage
                                    src={cexplorerLogo}
                                    alt="Cexplorer"
                                    boxSize="20px"
                                    opacity="0.8"
                                    _hover={{ opacity: "1" }}
                                    transition="opacity 0.2s"
                                  />
                                </ChakraLink>
                              <IconButton
                                icon={<CopyIcon />}
                                aria-label="Copy transaction hash"
                                onClick={() => handleCopyHash(transaction.tx_hash)}
                                size="md"
                                variant="ghost"
                                colorScheme="gray"
                                p="2"
                                borderRadius="md"
                                _hover={{ 
                                  bg: useColorModeValue("green.50", "green.900"),
                                  transform: "translateY(-1px)",
                                  boxShadow: "sm"
                                }}
                                transition="all 0.2s"
                              />
                            </Flex>
                          </Td>
                        </Tr>
                      )
                    })}
                  </Tbody>
                </Table>
              </TableContainer>

              {/* Pagination Controls */}
              <Flex 
                mt="6" 
                justify="space-between" 
                align="center" 
                flexWrap="wrap" 
                gap="6"
                p="6"
                bg={useColorModeValue("gray.50", "gray.800")}
                borderRadius="lg"
                borderTop="1px solid"
                borderColor={useColorModeValue("gray.200", "gray.600")}
              >
                <HStack spacing="4">
                  <Text fontSize="md" color={textColor} fontWeight="medium">
                    Show
                  </Text>
                  <Select
                    size="md"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    width="100px"
                    borderRadius="lg"
                    _hover={{ borderColor: "blue.300" }}
                    _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                  >
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="200">200</option>
                  </Select>
                  <Text fontSize="md" color={textColor} fontWeight="medium">
                    per page
                  </Text>
                </HStack>

                <HStack spacing="4">
                  <Text fontSize="md" color={textColor} fontWeight="semibold">
                    {sortedTransactions.length === 0 
                      ? '0' 
                      : `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, sortedTransactions.length)}`} 
                    {' '}of {sortedTransactions.length} transactions
                  </Text>
                </HStack>

                <HStack spacing="3">
                  <Button
                    size="md"
                    onClick={() => setCurrentPage(1)}
                    isDisabled={currentPage === 1}
                    variant="outline"
                    borderRadius="lg"
                    px="6"
                    py="2"
                    _hover={{ 
                      bg: useColorModeValue("blue.50", "blue.900"),
                      borderColor: "blue.300",
                      transform: "translateY(-1px)",
                      boxShadow: "md"
                    }}
                    transition="all 0.2s"
                  >
                    First
                  </Button>
                  <Button
                    size="md"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    isDisabled={currentPage === 1}
                    variant="outline"
                    borderRadius="lg"
                    px="6"
                    py="2"
                    _hover={{ 
                      bg: useColorModeValue("blue.50", "blue.900"),
                      borderColor: "blue.300",
                      transform: "translateY(-1px)",
                      boxShadow: "md"
                    }}
                    transition="all 0.2s"
                  >
                    Previous
                  </Button>
                  <Text 
                    fontSize="md" 
                    color={textColor} 
                    minW="120px" 
                    textAlign="center"
                    fontWeight="semibold"
                    px="4"
                    py="2"
                    bg={useColorModeValue("white", "gray.700")}
                    borderRadius="lg"
                    border="1px solid"
                    borderColor={useColorModeValue("gray.200", "gray.600")}
                  >
                    Page {currentPage} of {totalPages || 1}
                  </Text>
                  <Button
                    size="md"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    isDisabled={currentPage === totalPages || totalPages === 0}
                    variant="outline"
                    borderRadius="lg"
                    px="6"
                    py="2"
                    _hover={{ 
                      bg: useColorModeValue("blue.50", "blue.900"),
                      borderColor: "blue.300",
                      transform: "translateY(-1px)",
                      boxShadow: "md"
                    }}
                    transition="all 0.2s"
                  >
                    Next
                  </Button>
                  <Button
                    size="md"
                    onClick={() => setCurrentPage(totalPages)}
                    isDisabled={currentPage === totalPages || totalPages === 0}
                    variant="outline"
                    borderRadius="lg"
                    px="6"
                    py="2"
                    _hover={{ 
                      bg: useColorModeValue("blue.50", "blue.900"),
                      borderColor: "blue.300",
                      transform: "translateY(-1px)",
                      boxShadow: "md"
                    }}
                    transition="all 0.2s"
                  >
                    Last
                  </Button>
                </HStack>
              </Flex>
            </CardBody>
          </Card>
        ) : (
          <Alert status="info">
            <AlertIcon />
            No transactions found for this batcher.
          </Alert>
        )}
      </Box>
    </Box>
  )
}

export default BatcherDetailPage
