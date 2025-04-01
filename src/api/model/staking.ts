import { Token, Asset } from "./common"
import { TreasuryAsset } from "./treasury"

interface TallyMetadata {
  title: string
  description: string
  short_description: string
  creator_name: string
  forum_link: string
}

interface ProposalMetadata {
  title: string
  description: string
}

export interface Participation {
  end_time: string // can be None in "parse_delegated_actions"
  weight: string
  proposal_index: number
  proposal_id: string
  // TODO: there's "tally_auth_nft" in "parse_delegated_actions" and "tally" elsewhere
  tally?: {
    transaction_hash: string
    output_index: number
  }
  tally_auth_nft?: Token
  tally_metadata?: TallyMetadata
  proposal_metadata?: ProposalMetadata
}

export interface DelegatedAction {
  tag: "add_vote" | "retract_vote"
  participation: Participation
}

export interface StakingPosition {
  owner: string
  transaction_hash: string
  output_index: number
  funds: Asset[]
  participations: Participation[]
  vault_ft_policy: string
  gov_token: Token
  delegated_actions: DelegatedAction[]
  tally_auth_nft: Token
}

export interface StakingHistoryEntry {
  timestamp: string
  slot: number
  transaction_hash: string
  block_index: number
  funds: TreasuryAsset[]
  delegated_actions: DelegatedAction[]
  participations_added: Participation[]
  participations_retracted: Participation[]
  owner: string
}
