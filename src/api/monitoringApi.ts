import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import type { EndpointBuilder } from "@reduxjs/toolkit/query/react"
import { BatcherMonitoringData, BatcherStats, BatcherTransaction, BatcherAllStats } from "./model/monitoring"

const buildEndpoints = (builder: EndpointBuilder<any, any, any>) => ({
  getMonitoredBatchers: builder.query<BatcherMonitoringData[], void>({
    query: () => ({
      url: "batchers",
      method: "GET",
    }),
  }),
  getAllBatchersStats: builder.query<BatcherAllStats[], void>({
    query: () => ({
      url: "all-stats",
      method: "GET",
    }),
  }),
  getEnhancedMonitoredBatchers: builder.query<BatcherAllStats[], void>({
    query: () => ({
      url: "all-stats",
      method: "GET",
    }),
  }),
  getBatcherStats: builder.query<BatcherStats, string>({
    query: (address: string) => ({
      url: `stats?address=${address}`,
      method: "GET",
    }),
  }),
  getBatcherTransactions: builder.query<BatcherTransaction[], string>({
    query: (address: string) => ({
      url: `transactions?address=${address}`,
      method: "GET",
    }),
  }),
})

export const monitoringApi = createApi({
  reducerPath: "monitoringApi",
  baseQuery: fetchBaseQuery({ 
    baseUrl: "/api/monitoring/",
  }),
  endpoints: (builder) => buildEndpoints(builder),
})

export const {
  useGetMonitoredBatchersQuery,
  useGetAllBatchersStatsQuery,
  useGetEnhancedMonitoredBatchersQuery,
  useGetBatcherStatsQuery,
  useGetBatcherTransactionsQuery,
} = monitoringApi

