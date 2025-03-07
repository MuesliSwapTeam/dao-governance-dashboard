import { Token } from "./common"

export interface GovernanceState {
  transaction_hash: string
  output_index: number
  last_proposal_id: number
  tally_address: string
  staking_address: string
  gov_token: Token
  min_quorum: number
  min_proposal_duration: number
  min_winning_threshold: string
  gov_nft: Token
  tally_auth_nft_policy: string
  staking_vote_nft_policy: string
  latest_applied_proposal_id: number
}
