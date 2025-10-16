// VaultTable.tsx
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
  Flex,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react"
import { formatNumber, fromNativeAmount } from "../../utils/numericHelpers"
import { GOV_TOKEN_DECIMALS } from "../../cardano/config"
import { InfoIcon } from "@chakra-ui/icons"
import { VaultPosition } from "../../api/model/vault"
import { CARDANOSCAN_URL } from "../../constants"

interface VaultTableProps {
  vaultPositions: VaultPosition[]
  expandedPositionIndex: number | null
  setExpandedPositionIndex: (index: number | null) => void
  handleUnlockClick: (position: VaultPosition) => void
  handleMintFTClick: (position: VaultPosition) => void
  displayLockDate: (unlockDate: Date, voteEndedMessage?: boolean) => string
}

const VaultTable: FC<VaultTableProps> = ({
  vaultPositions,
  expandedPositionIndex,
  setExpandedPositionIndex,
  handleUnlockClick,
  handleMintFTClick,
  displayLockDate,
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

  const getUnlockDate = (position: VaultPosition) => {
    // TODO see if this needs to be converted to seconds
    const unlockDate = new Date(position.release_timestamp)
    return displayLockDate(unlockDate)
  }

  const formatLockedAmount = (amount: number) => {
    return formatNumber(
      fromNativeAmount(amount, GOV_TOKEN_DECIMALS),
      GOV_TOKEN_DECIMALS,
    )
  }

  return (
    <Table variant="simple">
      <Thead bg={bgSecColor}>
        <Tr>
          <Th>
            <Flex align="center">
              Amount
              <Tooltip
                label="This is the amount of tokens that are locked at the vault contract."
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
                label="This shows the date at which the tokens can be unlocked and rewards collected."
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
          <Th>
            <Flex align="center">
              Vote FTs Minted
              <Tooltip
                label="Indicates whether the vault fungible tokens for voting have already been minted for this position."
                aria-label="Vault FT Info"
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
          <Th colSpan={2} textAlign="center">
            Actions
          </Th>
        </Tr>
      </Thead>
      <Tbody>
        {vaultPositions.map((position, index) => {
          const unlockDate = getUnlockDate(position)
          const isUnlockable =
            new Date() >= new Date(position.release_timestamp)

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
                  <Text color={textColor}>
                    {formatLockedAmount(position.locked_amount)}
                  </Text>
                </Td>
                <Td>
                  <Text color={textColor}>{unlockDate}</Text>
                </Td>
                <Td>
                  <Link
                    color="teal.500"
                    href={`${CARDANOSCAN_URL}/transaction/${position.transaction_hash}`}
                    isExternal
                  >
                    {position.transaction_hash.slice(0, 6)}...
                    {position.transaction_hash.slice(-6)}
                  </Link>
                </Td>

                <Td>
                  <Text color={textColor}>
                    {position.vault_ft_already_minted ? "Yes" : "No"}
                  </Text>
                </Td>
                <Td>
                  <Button
                    width="5em"
                    isDisabled={!isUnlockable}
                    _hover={{
                      bg: !isUnlockable ? disabledColor : undefined,
                    }}
                    bg={!isUnlockable ? disabledColor : undefined}
                    _disabled={{ cursor: "not-allowed" }}
                    onClick={() => handleUnlockClick(position)}
                  >
                    Unlock
                  </Button>
                </Td>
                <Td>
                  <Button
                    width="8em"
                    isDisabled={position.vault_ft_already_minted}
                    _hover={{
                      bg: position.vault_ft_already_minted
                        ? disabledColor
                        : undefined,
                    }}
                    bg={
                      position.vault_ft_already_minted
                        ? disabledColor
                        : undefined
                    }
                    _disabled={{ cursor: "not-allowed" }}
                    onClick={() => handleMintFTClick(position)}
                  >
                    Mint Vote FTs
                  </Button>
                </Td>
              </Tr>
            </Fragment>
          )
        })}
      </Tbody>
    </Table>
  )
}

export default VaultTable
