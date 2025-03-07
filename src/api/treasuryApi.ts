import {
  BaseQueryFn,
  createApi,
  EndpointBuilder,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react"
import {
  TreasuryChartItem,
  TreasuryHistoryItem,
  TreasuryAsset,
} from "./model/treasury"
import { API_URL } from "../constants"

const buildEndpoints = (
  builder: EndpointBuilder<BaseQueryFn, any, "treasuryApi">,
) => ({
  getTreasuryFunds: builder.query<TreasuryAsset[], void>({
    query: () => `/api/v1/treasury/funds`,
  }),
  getTreasuryHistory: builder.query<TreasuryHistoryItem[], void>({
    query: () => `/api/v1/treasury/history`,
  }),
  getTreasuryChart: builder.query<TreasuryChartItem[], void>({
    query: () => `/api/v1/treasury/daily_chart`,
  }),
})

export const treasuryApi = createApi({
  reducerPath: "treasuryApi",
  baseQuery: fetchBaseQuery({ baseUrl: API_URL }),
  endpoints: buildEndpoints,
})

export const {
  useGetTreasuryFundsQuery,
  useGetTreasuryHistoryQuery,
  useGetTreasuryChartQuery,
} = treasuryApi
