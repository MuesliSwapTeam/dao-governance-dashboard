// Stake.tsx
import { FC, useEffect, useState } from "react"
import {
  Box,
  Heading,
  Text,
  VStack,
  Spinner,
  Flex,
  Button,
  useDisclosure,
  useColorModeValue,
} from "@chakra-ui/react"
import LockTokensModal from "../components/Staking/LockTokensModal"
import UnlockTokensModal from "../components/Staking/UnlockTokensModal"
import StakingTable from "../components/Staking/StakingTable"

import {
  getGovernanceTokenBalance,
  getWalletAddress,
  getVaultFTTotalBalance,
} from "../cardano/wallet"
import { formatNumber, fromNativeAmount } from "../utils/numericHelpers"
import {
  GOV_TOKEN_DECIMALS,
  GOV_TOKEN_NAME_HEX,
  GOV_TOKEN_POLICY_ID,
  GOV_TOKEN_SYMBOL,
  VAULT_FT_TOKEN_POLICY_ID,
  VAULT_FT_TOKEN_SYMBOL,
} from "../cardano/config"
import { Asset } from "../api/model/common"
import { skipToken } from "@reduxjs/toolkit/query/react"
import useWalletContext from "../context/wallet"
import { StakingPosition } from "../api/model/staking"
import { useGetStakingPositionsQuery } from "../api/stakingApi"
import { unsignedIntFromTokenname } from "../cardano/wallet"

export const getStakedAmount = (funds: Asset[]) => {
  let gov_token_funds = funds.filter(
    (x) =>
      x.policy_id === GOV_TOKEN_POLICY_ID &&
      x.asset_name === GOV_TOKEN_NAME_HEX,
  )

  let vault_ft_funds = funds.filter(
    (x) => x.policy_id === VAULT_FT_TOKEN_POLICY_ID,
  )

  let vaultFTAmounts: string[] = []
  const currentUnixTimeMS = Date.now()
  // TODO should we add a day to this threshold to reflect the stake that can
  // actually participate in votes?
  for (const ft of vault_ft_funds) {
    if (unsignedIntFromTokenname(ft.asset_name) > currentUnixTimeMS) {
      vaultFTAmounts.push(ft.amount)
    }
  }

  const vaultFTTotalAmount = vaultFTAmounts.reduce(
    (a, b) => BigInt(a) + BigInt(b),
    BigInt(0),
  )
  const vaultFTAmount = formatNumber(
    fromNativeAmount(vaultFTTotalAmount.toString(), GOV_TOKEN_DECIMALS),
    GOV_TOKEN_DECIMALS,
  )

  // if (funds.length === 0) return "0"

  let stakedGovAmount =
    gov_token_funds.length > 0
      ? formatNumber(
          fromNativeAmount(gov_token_funds[0].amount, GOV_TOKEN_DECIMALS),
          GOV_TOKEN_DECIMALS,
        )
      : "0"

  let retString =
    BigInt(vaultFTAmount) > 0
      ? `${stakedGovAmount} ${GOV_TOKEN_SYMBOL} + ${vaultFTAmount} Vault FT`
      : `${stakedGovAmount} ${GOV_TOKEN_SYMBOL}`
  return retString
}

// Calculate voting power for a single staking position filtering FT tokens by proposal end date
export const getVotingPowerForPosition = (
  funds: Asset[],
  proposalEndDate: number | null | undefined,
): number => {
  let gov_token_funds = funds.filter(
    (x) =>
      x.policy_id === GOV_TOKEN_POLICY_ID &&
      x.asset_name === GOV_TOKEN_NAME_HEX,
  )

  let vault_ft_funds = funds.filter(
    (x) => x.policy_id === VAULT_FT_TOKEN_POLICY_ID,
  )

  let vaultFTAmounts: string[] = []
  // Filter FT tokens by proposal end date instead of current time
  // Vault FTs cannot vote in proposals with no end date due to onchain limitations
  if (proposalEndDate) {
    for (const ft of vault_ft_funds) {
      if (unsignedIntFromTokenname(ft.asset_name) > proposalEndDate) {
        vaultFTAmounts.push(ft.amount)
      }
    }
  }

  const vaultFTTotalAmount = vaultFTAmounts.reduce(
    (a, b) => BigInt(a) + BigInt(b),
    BigInt(0),
  )
  const vaultFTVotingPower = Number(
    fromNativeAmount(vaultFTTotalAmount.toString(), GOV_TOKEN_DECIMALS),
  )

  const milkVotingPower =
    gov_token_funds.length > 0
      ? Number(fromNativeAmount(gov_token_funds[0].amount, GOV_TOKEN_DECIMALS))
      : 0

  return milkVotingPower + vaultFTVotingPower
}

// Find the best available staking position (highest voting power)
export const getBestAvailableStakingPosition = (
  stakingPositions: StakingPosition[],
  proposalId: string,
  proposalEndDate: number | null | undefined,
): { position: StakingPosition; votingPower: number; index: number } | null => {
  const availablePositions: {
    position: StakingPosition
    votingPower: number
    index: number
  }[] = []

  for (let i = 0; i < stakingPositions.length; i++) {
    const position = stakingPositions[i]
    // Check if this position is available (not already used for this proposal)
    const hasParticipation = position.participations.some(
      (x) => x.proposal_id.toString() === proposalId.toString(),
    )
    const hasDelegatedAction = position.delegated_actions.some(
      (x) => x.participation.proposal_id.toString() === proposalId.toString(),
    )

    if (!hasParticipation && !hasDelegatedAction) {
      const votingPower = getVotingPowerForPosition(
        position.funds,
        proposalEndDate,
      )
      if (votingPower > 0) {
        availablePositions.push({ position, votingPower, index: i })
      }
    }
  }

  // Return the position with the highest voting power, or null if none available
  return availablePositions.length > 0
    ? availablePositions.reduce((best, current) =>
        current.votingPower > best.votingPower ? current : best,
      )
    : null
}

const displayLockDate = (
  unlockDate: Date,
  voteEndedMessage: boolean = false,
) => {
  const now = new Date()
  if (unlockDate <= now) {
    if (!voteEndedMessage) return "-"
    return "Voting Period Ended"
  }
  return `${unlockDate.toLocaleDateString()} ${unlockDate.toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  )}`
}

const Stake: FC = () => {
  const { isConnected } = useWalletContext()
  const [walletAddressHex, setWalletAddressHex] = useState<string | null>(null)
  const [selectedUnlockStakePosition, setSelectedUnlockStakePosition] =
    useState<StakingPosition | null>(null)
  const [selectedLockStakePosition, setSelectedLockStakePosition] =
    useState<StakingPosition | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [expandedPositionIndex, setExpandedPositionIndex] = useState<
    number | null
  >(null)
  const [balance, setBalance] = useState(0)
  const [ftBalance, setFtBalance] = useState(0)

  // Effects
  useEffect(() => {
    if (!isConnected) return

    const updateBalance = async () => {
      const govBalance = await getGovernanceTokenBalance()
      setBalance(fromNativeAmount(govBalance, GOV_TOKEN_DECIMALS).toNumber())

      const vaultFTBalance = await getVaultFTTotalBalance()
      setFtBalance(
        fromNativeAmount(vaultFTBalance, GOV_TOKEN_DECIMALS).toNumber(),
      )
    }

    updateBalance()
    const interval = setInterval(updateBalance, 1000)
    return () => clearInterval(interval)
  }, [isConnected])

  useEffect(() => {
    const fetchWalletAddress = async () => {
      try {
        const address = await getWalletAddress()
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

  // Data fetching
  const {
    data: stakingPositions = [],
    isLoading,
    isUninitialized,
  } = useGetStakingPositionsQuery(
    walletAddressHex ? { wallet: walletAddressHex } : skipToken,
  )

  // Handlers
  const handleUnlockClick = (position: StakingPosition) => {
    setSelectedUnlockStakePosition(position)
  }

  const handleCloseUnlockModal = () => {
    setSelectedUnlockStakePosition(null)
  }

  const handleStakeClick = (position: StakingPosition) => {
    setSelectedLockStakePosition(position)
  }

  const handleCloseLockModal = () => {
    setSelectedLockStakePosition(null)
  }

  // Styles
  const bgColor = useColorModeValue("background.light", "background.dark")
  const disabledColor = useColorModeValue("grays.300.dark", "grays.600.dark")

  return (
    <Box m="24px 16px" sx={{ textAlign: "start" }}>
      <VStack align="start" spacing={4} w="100%">
        <Flex justify="space-between" align="center" w="100%" gap={10}>
          {/* Description Box */}
          <Box>
            <Heading as="h2" size="lg">
              Tokens Locked for DAO Voting
            </Heading>
            <Text fontSize="md">
              Here you can see your locked token positions which you can use to
              participate in DAO votings.
            </Text>
          </Box>

          {/* Balance Box */}
          {isConnected && (
            <Box
              bg={bgColor}
              p={4}
              borderRadius="md"
              boxShadow="md"
              borderWidth="1px"
              textAlign="left"
            >
              <Text fontSize="md">
                <b>{GOV_TOKEN_SYMBOL} Balance:</b> {balance}
              </Text>
              <Text fontSize="md">
                <b>{VAULT_FT_TOKEN_SYMBOL} Balance:</b> {ftBalance}
              </Text>
              {stakingPositions.length == 0 && (
                <Button
                  width="100%"
                  onClick={onOpen}
                  isDisabled={balance <= 0}
                  mt={2}
                  bg={balance <= 0 ? disabledColor : undefined}
                  _disabled={{ cursor: "not-allowed" }}
                >
                  Lock {GOV_TOKEN_SYMBOL}
                </Button>
              )}
            </Box>
          )}
        </Flex>

        {/* LockTokensModal */}
        <LockTokensModal
          isOpen={isOpen}
          onClose={onClose}
          balance={balance}
          ftBalance={ftBalance}
        />

        {/* Stake Positions Table */}
        {isLoading || (isUninitialized && isConnected) ? (
          <Flex justify="center" align="center" w="100%" h="20vh">
            <Spinner size="xl" />
          </Flex>
        ) : stakingPositions.length > 0 ? (
          <Box
            bg={bgColor}
            p={4}
            borderRadius="md"
            boxShadow="md"
            borderWidth="1px"
            width="100%"
            overflowX="auto"
          >
            <StakingTable
              stakingPositions={stakingPositions}
              expandedPositionIndex={expandedPositionIndex}
              setExpandedPositionIndex={setExpandedPositionIndex}
              handleUnlockClick={handleUnlockClick}
              handleStakeClick={handleStakeClick}
              displayLockDate={displayLockDate}
              getStakedAmount={getStakedAmount}
            />
          </Box>
        ) : (
          <Box
            bg={bgColor}
            p={4}
            borderRadius="md"
            boxShadow="md"
            borderWidth="1px"
            width="100%"
            textAlign="center"
          >
            <Text fontSize="md">
              {isConnected ? (
                <b>
                  Currently no tokens locked. Lock {GOV_TOKEN_SYMBOL} to
                  participate in DAO governance.
                </b>
              ) : (
                <b>
                  Connect your wallet to see your currently locked{" "}
                  {GOV_TOKEN_SYMBOL} and stake more.
                </b>
              )}
            </Text>
          </Box>
        )}
      </VStack>

      {/* UnlockTokensModal */}
      {selectedUnlockStakePosition && (
        <UnlockTokensModal
          isOpen={!!selectedUnlockStakePosition}
          onClose={handleCloseUnlockModal}
          position={selectedUnlockStakePosition}
        />
      )}

      {/* LockTokensModal */}
      {selectedLockStakePosition && (
        <LockTokensModal
          isOpen={!!selectedLockStakePosition}
          onClose={handleCloseLockModal}
          position={selectedLockStakePosition}
          balance={balance}
          ftBalance={ftBalance}
        />
      )}
    </Box>
  )
}

export default Stake
