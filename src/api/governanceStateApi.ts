import {
  BaseQueryFn,
  createApi,
  EndpointBuilder,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react"
import { API_URL } from "../constants"
import { GovernanceState } from "./model/governanceState"

const buildEndpoints = (
  builder: EndpointBuilder<BaseQueryFn, any, "governanceApi">,
) => ({
  getGovernanceState: builder.query<GovernanceState[], void>({
    query: () => `/api/v1/gov/state`,
  }),
})

export const governanceApi = createApi({
  reducerPath: "governanceApi",
  baseQuery: fetchBaseQuery({ baseUrl: API_URL }),
  endpoints: (builder) => buildEndpoints(builder),
})

export const { useGetGovernanceStateQuery, useLazyGetGovernanceStateQuery } =
  governanceApi
