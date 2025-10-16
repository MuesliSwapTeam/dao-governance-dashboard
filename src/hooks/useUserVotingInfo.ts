import { useState, useEffect } from "react"
import { useLazyGetStakingPositionsQuery } from "../api/stakingApi"
import useWalletContext from "../context/wallet"
import { getWalletAddress } from "../cardano/wallet"
import { StakingPosition, Participation } from "../api/model/staking"
import { formatNumber, fromNativeAmount } from "../utils/numericHelpers"
import { GOV_TOKEN_DECIMALS } from "../cardano/config"

export interface UserVoteInfo {
  hasVoted: boolean
  voteWeight?: string
  participation?: Participation
}

export interface UseUserVotingInfoReturn {
  getUserVoteInfo: (proposalId: string) => UserVoteInfo
  isLoading: boolean
  error: boolean
  stakingPositions: StakingPosition[]
}

/**
 * Custom hook to manage user voting information
 * Fetches user staking positions and provides utilities to check voting status
 */
export const useUserVotingInfo = (): UseUserVotingInfoReturn => {
  const { isConnected } = useWalletContext()
  const [walletAddressHex, setWalletAddressHex] = useState<string | null>(null)
  const [stakingPositions, setStakingPositions] = useState<StakingPosition[]>(
    [],
  )

  const [fetchStakingPositions, { isLoading, isUninitialized, isError }] =
    useLazyGetStakingPositionsQuery()

  // Effect to get wallet address when connected
  useEffect(() => {
    const fetchWalletAddress = async () => {
      try {
        const address = await getWalletAddress()
        setWalletAddressHex(address || null)
      } catch (error) {
        console.error("Failed to fetch wallet address", error)
        setWalletAddressHex(null)
      }
    }

    if (isConnected) {
      fetchWalletAddress()
    } else {
      setWalletAddressHex(null)
      setStakingPositions([])
    }
  }, [isConnected])

  // Effect to fetch staking positions when we have wallet address
  useEffect(() => {
    if (walletAddressHex && isConnected) {
      fetchStakingPositions({ wallet: walletAddressHex })
        .unwrap()
        .then((positions) => {
          setStakingPositions(positions)
        })
        .catch((error) => {
          console.error("Failed to fetch staking positions:", error)
          setStakingPositions([])
        })
    }
  }, [walletAddressHex, isConnected, fetchStakingPositions])

  /**
   * Get user vote information for a specific proposal
   */
  const getUserVoteInfo = (proposalId: string): UserVoteInfo => {
    if (!isConnected || !stakingPositions.length) {
      return { hasVoted: false }
    }

    // Check all staking positions for participations in this proposal
    for (const position of stakingPositions) {
      // Check direct participations
      const participation = position.participations.find(
        (p) => p.proposal_id.toString() === proposalId.toString(),
      )

      if (participation) {
        return {
          hasVoted: true,
          voteWeight: formatNumber(
            fromNativeAmount(participation.weight, GOV_TOKEN_DECIMALS),
            GOV_TOKEN_DECIMALS,
          ),
          participation,
        }
      }

      // Check delegated actions
      const delegatedAction = position.delegated_actions.find(
        (action) =>
          action.participation.proposal_id.toString() ===
            proposalId.toString() && action.tag === "add_vote",
      )

      if (delegatedAction) {
        return {
          hasVoted: true,
          voteWeight: formatNumber(
            fromNativeAmount(
              delegatedAction.participation.weight,
              GOV_TOKEN_DECIMALS,
            ),
            GOV_TOKEN_DECIMALS,
          ),
          participation: delegatedAction.participation,
        }
      }
    }

    return { hasVoted: false }
  }

  return {
    getUserVoteInfo,
    isLoading: isLoading || isUninitialized,
    error: isError,
    stakingPositions,
  }
}
