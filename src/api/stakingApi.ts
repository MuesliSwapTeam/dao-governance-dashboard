import {
  BaseQueryFn,
  createApi,
  EndpointBuilder,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react"
import { API_URL } from "../constants"
import { StakingPosition, StakingHistoryEntry } from "./model/staking"

interface StakingParams {
  wallet: string
}
interface OptStakingParams {
  wallet?: string
}

const buildEndpoints = (
  builder: EndpointBuilder<BaseQueryFn, any, "stakingApi">,
) => ({
  getStakingPositions: builder.query<StakingPosition[], StakingParams>({
    query: ({ wallet }) => `/api/v1/staking/positions?wallet=${wallet}`,
  }),
  getStakingHistory: builder.query<StakingHistoryEntry[], OptStakingParams>({
    query: (q) =>
      "/api/v1/staking/history" + (q.wallet ? `?wallet=${q.wallet}` : ""),
  }),
})

export const stakingApi = createApi({
  reducerPath: "stakingApi",
  baseQuery: fetchBaseQuery({ baseUrl: API_URL }),
  endpoints: (builder) => buildEndpoints(builder),
})

export const {
  useLazyGetStakingPositionsQuery,
  useGetStakingPositionsQuery,
  useGetStakingHistoryQuery,
} = stakingApi
