// StakingTable.tsx
import { FC, Fragment } from "react"
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Link,
  Button,
  IconButton,
  Collapse,
  Box,
  Flex,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react"
import { InfoIcon, ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons"
import ParticipationsTable from "./ParticipationsTable"
import { StakingPosition } from "../../api/model/staking"
import { Asset } from "../../api/model/common"

interface StakingTableProps {
  stakingPositions: StakingPosition[]
  expandedPositionIndex: number | null
  setExpandedPositionIndex: (index: number | null) => void
  handleUnlockClick: (position: StakingPosition) => void
  handleStakeClick: (position: StakingPosition) => void
  displayLockDate: (unlockDate: Date, voteEndedMessage?: boolean) => string
  getStakedAmount: (funds: Asset[]) => string
}

const StakingTable: FC<StakingTableProps> = ({
  stakingPositions,
  expandedPositionIndex,
  setExpandedPositionIndex,
  handleUnlockClick,
  handleStakeClick,
  displayLockDate,
  getStakedAmount,
}) => {
  // Styles
  const bgSecColor = useColorModeValue(
    "backgroundSecondary.light",
    "backgroundSecondary.dark",
  )
  const textColor = useColorModeValue("text.light", "text.dark")
  const textSubtleColor = useColorModeValue(
    "textSubtle.light",
    "textSubtle.dark",
  )
  const disabledColor = useColorModeValue("grays.300.dark", "grays.600.dark")

  const getUnlockDate = (position: StakingPosition) => {
    if (position.participations.length === 0) {
      return "-"
    }
    const maxEndTime = Math.max(
      ...position.participations.map((p) => Number(p.end_time)),
    )
    const unlockDate = new Date(maxEndTime)
    return displayLockDate(unlockDate)
  }

  return (
    <Table variant="simple">
      <Thead bg={bgSecColor}>
        <Tr>
          <Th>Participations</Th>
          <Th>
            <Flex align="center">
              Amount
              <Tooltip
                label="This is the amount of tokens that are currently locked"
                aria-label="Amount Info"
              >
                <IconButton
                  color={textSubtleColor}
                  aria-label="Info"
                  icon={<InfoIcon />}
                  size="sm"
                  mb="1px"
                  variant="ghost"
                />
              </Tooltip>
            </Flex>
          </Th>
          <Th>
            <Flex align="center">
              Unlock Date
              <Tooltip
                label="This shows the date at which the tokens can be unlocked."
                aria-label="Unlock Date Info"
              >
                <IconButton
                  color={textSubtleColor}
                  aria-label="Info"
                  icon={<InfoIcon />}
                  size="sm"
                  mb="1px"
                  variant="ghost"
                />
              </Tooltip>
            </Flex>
          </Th>
          <Th>Transaction Hash</Th>
          <Th colSpan={2} textAlign="center">
            Actions
          </Th>
        </Tr>
      </Thead>
      <Tbody>
        {stakingPositions.map((position, index) => {
          const unlockDate = getUnlockDate(position)
          const isUnlocked = unlockDate === "-"

          return (
            <Fragment key={index}>
              <Tr
                _hover={{ bg: bgSecColor, cursor: "pointer" }}
                onClick={() =>
                  setExpandedPositionIndex(
                    expandedPositionIndex === index ? null : index,
                  )
                }
              >
                <Td>
                  <IconButton
                    aria-label="Expand participations"
                    icon={
                      expandedPositionIndex === index ? (
                        <ChevronUpIcon />
                      ) : (
                        <ChevronDownIcon />
                      )
                    }
                    variant="outline"
                    size="lg"
                    mr={2} // adds some spacing between icon and text
                  />
                </Td>

                <Td>
                  <Text color={textColor}>
                    {getStakedAmount(position.funds)}
                  </Text>
                </Td>
                <Td>
                  <Text color={textColor}>{unlockDate}</Text>
                </Td>
                <Td>
                  <Link
                    color="teal.500"
                    href={`https://preprod.cardanoscan.io/transaction/${position.transaction_hash}`}
                    isExternal
                  >
                    {position.transaction_hash.slice(0, 6)}...
                    {position.transaction_hash.slice(-6)}
                  </Link>
                </Td>
                <Td>
                  <Button
                    width="5em"
                    isDisabled={!isUnlocked}
                    _hover={{
                      bg: !isUnlocked ? disabledColor : undefined,
                    }}
                    bg={!isUnlocked ? disabledColor : undefined}
                    _disabled={{ cursor: "not-allowed" }}
                    onClick={() => handleUnlockClick(position)}
                  >
                    Unstake
                  </Button>
                </Td>
                <Td>
                  <Button
                    width="6em"
                    // isDisabled={!isUnlocked}
                    // _hover={{
                    //   bg: !isUnlocked ? disabledColor : undefined,
                    // }}
                    // bg={!isUnlocked ? disabledColor : undefined}
                    // _disabled={{ cursor: "not-allowed" }}
                    onClick={() => handleStakeClick(position)}
                  >
                    Stake More
                  </Button>
                </Td>
              </Tr>
              {/* Participations Subtable */}
              <Tr>
                <Td colSpan={6} p={0}>
                  <Collapse in={expandedPositionIndex === index} animateOpacity>
                    <Box
                      p={4}
                      bg={bgSecColor}
                      borderRadius="md"
                      boxShadow="md"
                      borderWidth="1px"
                    >
                      <Text fontSize="md" fontWeight="bold" mb={2} ml={4}>
                        Participated Votes
                      </Text>
                      <ParticipationsTable
                        stakingPosition={position}
                        displayLockDate={displayLockDate}
                      />
                    </Box>
                  </Collapse>
                </Td>
              </Tr>
            </Fragment>
          )
        })}
      </Tbody>
    </Table>
  )
}

export default StakingTable
