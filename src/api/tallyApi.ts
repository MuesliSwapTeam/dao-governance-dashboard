import {
  BaseQueryFn,
  createApi,
  EndpointBuilder,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react"
import { Proposal, TallyResponse, VoteType } from "./model/tally"
import { API_URL } from "../constants"

interface GetTalliesParams {
  open: boolean // Show open tallies
  closed: boolean // Show closed tallies
}

interface GetTallyDetailParams {
  tally_auth_nft: string
  tally_proposal_id: string
}

function transformTallyToProposal(t: TallyResponse): Proposal {
  return {
    id: t.proposal_id,
    vaultPolicyId: t.vault_ft_policy_id,
    authNft: {
      policyId: t.tally_auth_nft.policy_id,
      name: t.tally_auth_nft.asset_name,
    },
    govToken: {
      policyId: t.gov_token.policy_id,
      name: t.gov_token.asset_name,
    },
    output: {
      hash: t.transaction_output.transaction_hash,
      index: t.transaction_output.output_index,
    },

    title: t.title,
    description: t.description,
    links: t.links ?? [],
    summary: t.summary ?? "",
    status: t.is_open ? "open" : "closed",
    endDate: t.end_time,
    endDatePosix: t.end_time_posix,
    creatorName: t.creator_name,

    quorum: t.quorum,
    totalWeight: t.total_weight,

    votes: t.votes.map((v) => ({
      weight: v.weight,
      args: v.proposal,
      title: v.title,
      type: v.proposal_type as VoteType,
      description: v.description,
    })),
    voteTypes: Array.from(
      new Set(t.votes.map((v) => v.proposal_type as VoteType)),
    ),
  }
}

function transformMatchmakerTallyToProposal(t: TallyResponse): Proposal {
  return {
    id: t.proposal_id,
    vaultPolicyId: t.vault_ft_policy_id,
    authNft: {
      policyId: t.tally_auth_nft.policy_id,
      name: t.tally_auth_nft.asset_name,
    },
    govToken: {
      policyId: t.gov_token.policy_id,
      name: t.gov_token.asset_name,
    },
    output: {
      hash: t.transaction_output.transaction_hash,
      index: t.transaction_output.output_index,
    },

    title: t.title,
    description: t.description,
    links: t.links ?? [],
    summary: t.summary ?? "",
    status: t.is_open ? "open" : "closed",
    endDate: t.end_time,
    endDatePosix: t.end_time_posix,
    creatorName: t.creator_name,

    quorum: t.quorum,
    totalWeight: t.total_weight,

    // Matchmaker-specific vote processing
    votes: t.votes.map((v) => {
      // Determine vote type based on proposal structure or title
      let voteType: VoteType = "Opinion" // default fallback

      // Check if proposal_type exists in the data
      if (v.proposal_type) {
        voteType = v.proposal_type as VoteType
      } else {
        // Fallback to title-based detection for matchmaker tallies
        if (v.title === "Nothing") {
          voteType = "Reject"
        } else if (
          v.title === "Release License" ||
          v.title.includes("License")
        ) {
          voteType = "LicenseRelease"
        }
      }

      return {
        weight: v.weight,
        args: v.proposal,
        title: v.title,
        type: voteType,
        description: v.description,
        details: v.details, // Include details field from API response
      }
    }),
    voteTypes: Array.from(
      new Set(
        t.votes.map((v) => {
          if (v.proposal_type) {
            return v.proposal_type as VoteType
          } else {
            // Fallback to title-based detection
            if (v.title === "Nothing") return "Reject"
            if (v.title === "Release License" || v.title.includes("License"))
              return "LicenseRelease"
            return "Opinion"
          }
        }),
      ),
    ),
  }
}

const buildEndpoints = (
  builder: EndpointBuilder<BaseQueryFn, any, "tallyApi">,
) => ({
  getTallies: builder.query<Proposal[], GetTalliesParams>({
    query: ({ open, closed }) =>
      `/api/v1/tallies?open=${open}&closed=${closed}`,
    transformResponse: (tallies: TallyResponse[]): Proposal[] =>
      tallies.map(transformTallyToProposal),
  }),
  getMatchmakerTallies: builder.query<Proposal[], GetTalliesParams>({
    query: ({ open, closed }) =>
      `/api/v1/tallies/batcher-licenses?open=${open}&closed=${closed}`,
    transformResponse: (tallies: TallyResponse[]): Proposal[] =>
      tallies.map(transformMatchmakerTallyToProposal),
  }),
  getTallyDetail: builder.query<Proposal[], GetTallyDetailParams>({
    query: ({ tally_auth_nft, tally_proposal_id }) =>
      `/api/v1/tallies/tally_detail?tally-auth-nft=${tally_auth_nft}&tally-proposal-id=${tally_proposal_id}`,
    transformResponse: (tallies: TallyResponse[]): Proposal[] =>
      tallies.map(transformTallyToProposal),
  }),
  getMatchmakerTallyDetail: builder.query<Proposal[], GetTallyDetailParams>({
    query: ({ tally_auth_nft, tally_proposal_id }) =>
      `/api/v1/tallies/tally_detail?tally-auth-nft=${tally_auth_nft}&tally-proposal-id=${tally_proposal_id}`,
    transformResponse: (tallies: TallyResponse[]): Proposal[] =>
      tallies.map(transformMatchmakerTallyToProposal),
  }),
  getTallyVotes: builder.query<void, GetTallyDetailParams>({
    query: ({ tally_auth_nft, tally_proposal_id }) =>
      `/api/v1/tallies/tally_votes?tally-auth-nft=${tally_auth_nft}&tally-proposal-id=${tally_proposal_id}`,
  }),
})

export const tallyApi = createApi({
  reducerPath: "tallyApi",
  baseQuery: fetchBaseQuery({ baseUrl: API_URL }),
  endpoints: buildEndpoints,
})

export const {
  useGetTalliesQuery,
  useGetTallyDetailQuery,
  useGetTallyVotesQuery,
  useGetMatchmakerTalliesQuery,
  useGetMatchmakerTallyDetailQuery,
} = tallyApi
