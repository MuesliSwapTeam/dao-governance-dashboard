import { Token } from "./common"

export type VoteResponse = {
  weight: number
  proposal: any // ? RawPlutusData.from_cbor().to_dict()
  proposal_type: string

  title: string
  description: string
}

export type TallyResponse = {
  quorum: number
  is_open: boolean
  end_time: string
  end_time_posix: number
  proposal_id: number
  tally_auth_nft: Token
  staking_vote_nft_policy_id: string
  staking_address: string
  gov_token: Token
  vault_ft_policy_id: string
  total_weight: number
  votes: VoteResponse[]
  transaction_output: {
    transaction_hash: string
    output_index: number
  }

  title: string
  summary: string
  description: string
  creator_name: string
  links: string[]
}

// Result Types

export type Asset = { quantity: number; unit: string }
export type FundPayoutArgs = { address: string; assets: Asset[] }
export type OpinionArgs = string

export type VoteArgsMap = {
  FundPayout: FundPayoutArgs
  Opinion: OpinionArgs
}

export type VoteType =
  | "GovStateUpdate"
  | "LicenseRelease"
  | "PoolUpgrade"
  | "FundPayout"
  | "Opinion"
  | "Reject"
export type VoteArgs<T extends VoteType> =
  | Readonly<T extends keyof VoteArgsMap ? VoteArgsMap[T] : Record<string, any>>
  | {}

export type VoteResult = {
  weight: number
  title: string
  description: string
} & (
  | { type: "FundPayout"; args: VoteArgsMap["FundPayout"] }
  | { type: "Opinion"; args: VoteArgsMap["Opinion"] }
  | { type: VoteType; args: VoteArgs<VoteType> }
)

export type Vote = Pick<VoteResult, "title" | "description" | "type" | "args">

export type Proposal = {
  id: number
  authNft: { policyId: string; name: string }
  govToken: { policyId: string; name: string }
  vaultPolicyId: string
  output: { hash: string; index: number }

  totalWeight: number
  quorum: number

  title: string
  status: "open" | "closed"
  summary: string
  description: string
  links: string[]
  endDate: string
  endDatePosix: number

  votes: VoteResult[]
  voteTypes: VoteType[]
  creatorName: string
}
