import {
  BaseQueryFn,
  createApi,
  EndpointBuilder,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react"
import { API_URL } from "../constants"
import { TokenEntry } from "./model/tokens"

const buildEndpoints = (
  builder: EndpointBuilder<BaseQueryFn, any, "tokensApi">,
) => ({
  getAllTokens: builder.query<TokenEntry[], null>({
    query: () => `/api/v1/tokens/all`,
  }),
  getCuratedTokens: builder.query<TokenEntry[], null>({
    query: () => `/api/v1/tokens/curated`,
  }),
})

export const tokensApi = createApi({
  reducerPath: "tokensApi",
  baseQuery: fetchBaseQuery({ baseUrl: API_URL }),
  endpoints: (builder) => buildEndpoints(builder),
})

export const { useGetAllTokensQuery, useGetCuratedTokensQuery } = tokensApi
