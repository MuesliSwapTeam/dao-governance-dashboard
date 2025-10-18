import { Fragment } from "react"
import {
  Tooltip,
  Box,
  Flex,
  Heading,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
} from "@chakra-ui/react"
import { TreasuryAsset } from "../../api/model/treasury"
import { formatNumber, fromNativeAmount } from "../../utils/numericHelpers"

const HistoryCard = ({
  transactions,
}: {
  transactions: {
    type: string
    amounts: TreasuryAsset[]
    date: string
    txHash: string
    reason: string
    breakdown: string | undefined
    daoDecision: string | undefined
  }[]
}) => {
  const bgColor = useColorModeValue(
    "backgroundSecondary.light",
    "backgroundSecondary.dark",
  )

  return (
    <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="lg">
      <Flex justify="space-between" align="center" mb={4}>
        <Heading as="h3" size="md">
          History
        </Heading>
      </Flex>

      <Text variant="md" mb={4}>
        These are the most recent changes in the treasury.
      </Text>
      <Box overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Transaction Type</Th>
              <Th>Amount</Th>
              <Th>Date</Th>
              <Th>Transaction Hash</Th>
              <Th>Reason</Th>
              <Th>DAO Decision</Th>
            </Tr>
          </Thead>
          <Tbody>
            {transactions.map((transaction, index) => {
              const amounts = [...transaction.amounts].sort(
                (a, b) =>
                  Number(a.eqAmountLvl ?? 0) - Number(b.eqAmountLvl ?? 0),
              )
              const topAmounts = amounts
                .slice(0, 3)
                .map(({ amount, decimalPlaces, symbol }) => (
                  <Fragment key={symbol}>
                    {`${formatNumber(fromNativeAmount(amount, decimalPlaces), 2)} ${symbol}`}
                    <br />
                  </Fragment>
                ))
              const detailedAmounts = amounts.map(
                ({ amount, decimalPlaces, symbol, eqAmountLvl }) => {
                  const tokenAmount = formatNumber(
                    fromNativeAmount(amount, decimalPlaces),
                    2,
                  )
                  const adaAmount = eqAmountLvl
                    ? `(${formatNumber(fromNativeAmount(eqAmountLvl, 6), 0)} ADA)`
                    : ""
                  const v = `${tokenAmount} ${symbol} ${adaAmount}`
                  return (
                    <Fragment key={symbol}>
                      {" "}
                      {v} <br />
                    </Fragment>
                  )
                },
              )
              return (
                <Tr key={index}>
                  <Td>{transaction.type}</Td>
                  <Td>
                    <Tooltip hasArrow label={detailedAmounts} fontSize="md">
                      <Box>
                        {topAmounts}
                        {amounts.length >= 3 ? <>...</> : undefined}
                      </Box>
                    </Tooltip>
                  </Td>
                  <Td>{transaction.date}</Td>
                  <Td>
                    <a
                      href={`https://preprod.cardanoscan.io/transaction/${transaction.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {transaction.txHash.slice(0, 12)}...
                      {transaction.txHash.slice(transaction.txHash.length - 3)}
                    </a>
                  </Td>
                  <Td>{transaction.reason}</Td>
                  <Td>
                    {transaction.type === "Withdrawal" &&
                    transaction.daoDecision ? (
                      <a
                        href={transaction.daoDecision}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Decision
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </Td>
                </Tr>
              )
            })}
          </Tbody>
        </Table>
      </Box>
    </Box>
  )
}

export default HistoryCard
