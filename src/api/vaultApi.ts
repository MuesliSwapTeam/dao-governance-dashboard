import {
  BaseQueryFn,
  createApi,
  EndpointBuilder,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react"
import { VaultPosition } from "./model/vault"
import { API_URL } from "../constants"

interface VaultPositionsParams {
  pkh: string
}

interface OpenVaultPositionParams {
  address: string
  amount: number
  locked_weeks: number
}

interface MintVaultFTParams {
  address: string
  tx_hash: string
  output_index: number
}

interface CloseVaultPositionParams {
  address: string
  tx_hash: string
  output_index: number
}

interface AppendSignatureRequest {
  tx: string
  tx_body: string
  witness_set: string
}

interface TransactionResponse {
  signed_tx: string
  tx_body: string
}

const buildEndpoints = (
  builder: EndpointBuilder<BaseQueryFn, any, "vaultApi">,
) => ({
  getVaultPositions: builder.query<VaultPosition[], VaultPositionsParams>({
    query: ({ pkh }) => `/api/v1/vault/positions?pkh=${pkh}`,
  }),
  getOpenVaultPositionTransaction: builder.mutation<
    TransactionResponse,
    OpenVaultPositionParams
  >({
    query: ({ address, amount, locked_weeks }) => ({
      url: `/api/v1/vault/open_position`,
      method: "POST",
      body: { address, amount, locked_weeks },
    }),
  }),
  getMintVaultFTTransaction: builder.mutation<
    TransactionResponse,
    MintVaultFTParams
  >({
    query: ({ address, tx_hash, output_index }) => ({
      url: `/api/v1/vault/mint_ft`,
      method: "POST",
      body: { address, tx_hash, output_index },
    }),
  }),
  getCloseVaultPositionTransaction: builder.mutation<
    TransactionResponse,
    CloseVaultPositionParams
  >({
    query: ({ address, tx_hash, output_index }) => ({
      url: `/api/v1/vault/close_position`,
      method: "POST",
      body: { address, tx_hash, output_index },
    }),
  }),
  appendSignature: builder.mutation<string, AppendSignatureRequest>({
    query: ({ tx, tx_body, witness_set }) => ({
      url: `/api/v1/append_signature`,
      method: "POST",
      body: { tx, tx_body, witness_set },
    }),
  }),
})

export const vaultApi = createApi({
  reducerPath: "vaultApi",
  baseQuery: fetchBaseQuery({ baseUrl: API_URL }),
  endpoints: (builder) => buildEndpoints(builder),
})

export const {
  useGetVaultPositionsQuery,
  useGetOpenVaultPositionTransactionMutation,
  useGetMintVaultFTTransactionMutation,
  useGetCloseVaultPositionTransactionMutation,
  useAppendSignatureMutation,
} = vaultApi
