import {
  Box,
  Flex,
  Text,
  useColorModeValue,
  IconButton,
  useToast,
  Link as ChakraLink,
  Image as ChakraImage,
  Heading,
  Button,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  Tooltip,
} from "@chakra-ui/react"
import { CopyIcon } from "@chakra-ui/icons"
import { Link } from "react-router-dom"
import React from "react"

import cardanoScanLogo from "../assets/cardanoscan-favicon-32x32.png"
import cexplorerLogo from "../assets/cexplorer-favicon.svg"
import taptoolsLogo from "../assets/taptools-favicon.png"
import { BatcherMonitoringData, EnhancedMonitoringEntry } from "../api/model/monitoring"
import { formatNumber } from "../utils/numericHelpers"

interface MonitoringListProps {
  monitoredBatchers: BatcherMonitoringData[] | EnhancedMonitoringEntry[]
}

const MonitoringList: React.FC<MonitoringListProps> = ({ monitoredBatchers }) => {
  const textColor = useColorModeValue("text.light", "text.dark")
  const cardBg = useColorModeValue("white", "gray.800")
  const cardBorderColor = useColorModeValue("gray.200", "gray.700")
  
  const toast = useToast()

  // Helper functions for enhanced data
  const formatProfit = (profit: number) => {
    const adaValue = profit / 1_000_000
    return `${adaValue >= 0 ? '+' : ''}${formatNumber(adaValue, 2)} ADA`
  }

  const formatProcessingTime = (timeMs: number) => {
    return `${(timeMs / 1000).toFixed(3)} s`
  }

  const getPerformanceColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'green'
      case 'good': return 'blue'
      case 'average': return 'yellow'
      case 'poor': return 'red'
      default: return 'gray'
    }
  }

  const getProfitColor = (status: string) => {
    switch (status) {
      case 'profitable': return 'green'
      case 'mixed': return 'yellow'
      case 'losing': return 'red'
      default: return 'gray'
    }
  }

  return (
    <Flex flexDir="column" rowGap="1em">
      {monitoredBatchers.map((batcher, index) => {
        // Handle both types of data
        const isEnhancedEntry = 'batcher_address' in batcher
        const batcherAddress = isEnhancedEntry 
          ? (batcher as EnhancedMonitoringEntry).batcher_address 
          : (batcher as BatcherMonitoringData).addresses[0]
        const numTransactions = isEnhancedEntry 
          ? (batcher as EnhancedMonitoringEntry).num_transactions 
          : (batcher as BatcherMonitoringData).num_transactions
        const enhancedData = isEnhancedEntry ? (batcher as EnhancedMonitoringEntry) : null

        return (
          <Box
            key={`${batcherAddress}-${index}`}
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
              {/* Title and Status Badges */}
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
                    Batcher #{index + 1}
                  </Heading>
                </Box>

                <Flex gap="2">
                  {/* Performance Badge */}
                  {enhancedData?.performance_status && (
                    <Tooltip label={`Processing performance: ${enhancedData.performance_status}`}>
                      <Badge
                        colorScheme={getPerformanceColor(enhancedData.performance_status)}
                        variant="subtle"
                        fontSize="xs"
                        px="2"
                        py="1"
                        borderRadius="md"
                      >
                        {enhancedData.performance_status.toUpperCase()}
                      </Badge>
                    </Tooltip>
                  )}
                  
                  {/* Profit Status Badge */}
                  {enhancedData?.profit_status && (
                    <Tooltip label={`Profitability status: ${enhancedData.profit_status}`}>
                      <Badge
                        colorScheme={getProfitColor(enhancedData.profit_status)}
                        variant="subtle"
                        fontSize="xs"
                        px="2"
                        py="1"
                        borderRadius="md"
                      >
                        {enhancedData.profit_status.toUpperCase()}
                      </Badge>
                    </Tooltip>
                  )}

                  {/* Monitoring Status Badge */}
                  <Badge
                    colorScheme="green"
                    variant="subtle"
                    fontSize="xs"
                    px="2"
                    py="1"
                    borderRadius="md"
                  >
                    ✓ MONITORED
                  </Badge>
                </Flex>
              </Flex>

              {/* Enhanced Statistics Grid */}
              {enhancedData ? (
                <Grid templateColumns="repeat(auto-fit, minmax(180px, 1fr))" gap="4">
                  {/* Total Transactions */}
                  <Box
                    p="3"
                    bg={useColorModeValue("blue.50", "blue.900")}
                    borderRadius="lg"
                    border={`1px solid ${useColorModeValue("blue.200", "blue.600")}`}
                  >
                    <Stat size="sm">
                      <StatLabel fontSize="xs" color="gray.500" fontWeight="medium">
                        TRANSACTIONS
                      </StatLabel>
                      <StatNumber fontSize="xl" color={textColor}>
                        {numTransactions.toLocaleString()}
                      </StatNumber>
                    </Stat>
                  </Box>

                  {/* Total Profit */}
                  {enhancedData.total_profit !== undefined && (
                    <Box
                      p="3"
                      bg={useColorModeValue("green.50", "green.900")}
                      borderRadius="lg"
                      border={`1px solid ${useColorModeValue("green.200", "green.600")}`}
                    >
                      <Stat size="sm">
                        <StatLabel fontSize="xs" color="gray.500" fontWeight="medium">
                          TOTAL PROFIT
                        </StatLabel>
                        <StatNumber 
                          fontSize="xl" 
                          color={enhancedData.total_profit >= 0 ? "green.600" : "red.500"}
                        >
                          {formatProfit(enhancedData.total_profit)}
                        </StatNumber>
                      </Stat>
                    </Box>
                  )}

                  {/* Average Profit */}
                  {enhancedData.avg_profit !== undefined && (
                    <Box
                      p="3"
                      bg={useColorModeValue("purple.50", "purple.900")}
                      borderRadius="lg"
                      border={`1px solid ${useColorModeValue("purple.200", "purple.600")}`}
                    >
                      <Stat size="sm">
                        <StatLabel fontSize="xs" color="gray.500" fontWeight="medium">
                          AVG PROFIT
                        </StatLabel>
                        <StatNumber 
                          fontSize="xl" 
                          color={enhancedData.avg_profit >= 0 ? "green.600" : "red.500"}
                        >
                          {formatProfit(enhancedData.avg_profit)}
                        </StatNumber>
                      </Stat>
                    </Box>
                  )}

                  {/* Processing Time */}
                  {enhancedData.avg_processing_time !== undefined && (
                    <Box
                      p="3"
                      bg={useColorModeValue("orange.50", "orange.900")}
                      borderRadius="lg"
                      border={`1px solid ${useColorModeValue("orange.200", "orange.600")}`}
                    >
                      <Stat size="sm">
                        <StatLabel fontSize="xs" color="gray.500" fontWeight="medium">
                          AVG PROCESSING
                        </StatLabel>
                        <StatNumber fontSize="xl" color={textColor}>
                          {formatProcessingTime(enhancedData.avg_processing_time)}
                        </StatNumber>
                        <StatHelpText fontSize="xs" mt="1">
                          {enhancedData.avg_processing_time < 1000 
                            ? "Fast" 
                            : enhancedData.avg_processing_time < 5000 
                            ? "Good" 
                            : "Slow"}
                        </StatHelpText>
                      </Stat>
                    </Box>
                  )}
                </Grid>
              ) : (
                // Fallback for basic data
                <Box
                  p="3"
                  bg={useColorModeValue("blue.50", "blue.900")}
                  borderRadius="lg"
                  border={`1px solid ${useColorModeValue("blue.200", "blue.600")}`}
                >
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    fontWeight="medium"
                    mb="1"
                  >
                    TOTAL TRANSACTIONS
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                    {numTransactions.toLocaleString()}
                  </Text>
                </Box>
              )}

              {/* Address Section */}
              <Box
                p="3"
                bg={useColorModeValue("gray.50", "gray.700")}
                borderRadius="lg"
                border={`1px solid ${useColorModeValue("gray.200", "gray.600")}`}
              >
                {isEnhancedEntry ? (
                  // Single address for enhanced entries
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Text
                        fontSize="xs"
                        color="gray.500"
                        fontWeight="medium"
                        mb="1"
                      >
                        BATCHER ADDRESS
                      </Text>
                      <Text
                        fontSize="sm"
                        fontFamily="mono"
                        color={textColor}
                        fontWeight="medium"
                      >
                        {`${batcherAddress.slice(0, 12)}...${batcherAddress.slice(-12)}`}
                      </Text>
                    </Box>

                    <Flex align="center" gap="2">
                      {/* Explorer Links */}
                      <ChakraLink
                        href={`https://cardanoscan.io/address/${batcherAddress}`}
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
                        href={`https://cexplorer.io/address/${batcherAddress}`}
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
                              "The batcher address has been copied to your clipboard.",
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
                ) : (
                  // Multiple addresses for basic entries
                  (batcher as BatcherMonitoringData).addresses.map((address, addressIndex) => (
                    <Flex 
                      key={address} 
                      justify="space-between" 
                      align="center"
                      mb={addressIndex < (batcher as BatcherMonitoringData).addresses.length - 1 ? "3" : "0"}
                    >
                      <Box>
                        <Text
                          fontSize="xs"
                          color="gray.500"
                          fontWeight="medium"
                          mb="1"
                        >
                          BATCHER ADDRESS {(batcher as BatcherMonitoringData).addresses.length > 1 ? `#${addressIndex + 1}` : ''}
                        </Text>
                        <Text
                          fontSize="sm"
                          fontFamily="mono"
                          color={textColor}
                          fontWeight="medium"
                        >
                          {`${address.slice(0, 12)}...${address.slice(-12)}`}
                        </Text>
                      </Box>

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
                            boxSize="20px"
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
                            boxSize="20px"
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
                            navigator.clipboard.writeText(address)
                            toast({
                              title: "Address copied!",
                              description:
                                "The batcher address has been copied to your clipboard.",
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
                  ))
                )}
              </Box>

              {/* Action Button */}
              <Flex mt="6" justify="flex-end">
                <Link to={`/batchers/${batcherAddress}`}>
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
            </Flex>
          </Box>
        )
      })}

      {monitoredBatchers.length === 0 && (
        <Box
          p="24px"
          bg={cardBg}
          borderRadius="xl"
          boxShadow="sm"
          border={`1px solid ${cardBorderColor}`}
          textAlign="center"
        >
          <Text color="gray.500" fontSize="lg">
            No monitored batchers found.
          </Text>
        </Box>
      )}
    </Flex>
  )
}

export default MonitoringList
