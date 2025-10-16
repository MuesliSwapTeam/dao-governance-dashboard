// constants.ts
import { store } from "../store"

// ===============
// GOV TOKEN DETAILS
// ===============
export let GOV_TOKEN_DECIMALS: number
export let GOV_TOKEN_POLICY_ID: string
export let GOV_TOKEN_NAME_HEX: string
export let GOV_TOKEN_SYMBOL: string
export let GOV_SUBJECT: string

// ===============
// VAULT FT TOKENS DETAILS
// ===============
export let VAULT_FT_TOKEN_DECIMALS: number
export let VAULT_FT_TOKEN_POLICY_ID: string
export let VAULT_FT_TOKEN_NAME_HEX: string
export let VAULT_FT_TOKEN_SYMBOL: string

// ===============
// GOV STATE NFT TOKEN DETAILS
// ===============
export let GOV_STATE_NFT_POLICY_ID: string
export let GOV_STATE_NFT_TOKEN_NAME_HEX: string

// ===============
// TALLY AUTH NFT TOKEN DETAILS
// ===============
export let TALLY_AUTH_NFT_POLICY_ID: string
export let TALLY_AUTH_NFT_NAME_HEX: string

// ===============
// TALLY AUTH SCRIPT REF
// ===============
export let TALLY_AUTH_NFT_SCRIPT_HASH: string
export let TALLY_AUTH_NFT_REF_TRANSACTION_HASH: string
export let TALLY_AUTH_NFT_REF_INDEX: number
export let TALLY_AUTH_NFT_REF_SCRIPT_SIZE: number

// ===============
// STAKING SCRIPT DATA
// ===============
export let STAKING_ADDR: string
export let STAKING_SCRIPT_HASH: string
export let STAKING_REF_TRANSACTION_HASH: string
export let STAKING_REF_INDEX: number
export let STAKING_REF_SCRIPT_SIZE: number

// ===============
// TALLY SCRIPT DATA
// ===============
export let TALLY_ADDR: string
export let TALLY_SCRIPT_HASH: string

// ===============
// VOTE PERMISSION NFT SCRIPT
// ===============
export let VOTE_PERMISSION_NFT_SCRIPT_HASH: string
export let VOTE_PERMISSION_NFT_REF_TRANSACTION_HASH: string
export let VOTE_PERMISSION_NFT_REF_INDEX: number
export let VOTE_PERMISSION_NFT_REF_SCRIPT_SIZE: number

// ===============
// GOV STATE DATA
// ===============
export let GOV_STATE_ADDR: string

// ===============
// GOV STATE SCRIPT REF
// ===============
export let GOV_STATE_SCRIPT_HASH: string
export let GOV_STATE_REF_TRANSACTION_HASH: string
export let GOV_STATE_REF_INDEX: number
export let GOV_STATE_SCRIPT_SIZE: number

// ===============
// STAKING VOTE NFT POLICY
// ===============
export let STAKING_VOTE_NFT_POLICY_ID: string
export let STAKING_VOTE_NFT_REF_TRANSACTION_HASH: string
export let STAKING_VOTE_NFT_REF_INDEX: number
export let STAKING_VOTE_NFT_REF_SCRIPT_SIZE: number

// ===============
// ENVIRONMENT
// ===============
export const DEBUG = true

// ===============
// INITIALIZER
// ===============
export function initConstants() {
  const state = store.getState()

  if (!state?.constants?.data) {
    throw new Error("Governance state not loaded yet")
  }

  // GOV TOKEN
  GOV_TOKEN_DECIMALS = state.constants.data.governance_token.decimals
  GOV_TOKEN_POLICY_ID = state.constants.data.governance_token.policy_id
  GOV_TOKEN_NAME_HEX = state.constants.data.governance_token.token_name
  GOV_TOKEN_SYMBOL = state.constants.data.governance_token.symbol
  GOV_SUBJECT = GOV_TOKEN_POLICY_ID + GOV_TOKEN_NAME_HEX

  // VAULT FT
  VAULT_FT_TOKEN_DECIMALS = state.constants.data.governance_token.decimals
  VAULT_FT_TOKEN_POLICY_ID = state.constants.data.policy_ids.vault_ft
  VAULT_FT_TOKEN_NAME_HEX = "dummy" // TODO this is actually not a constant
  VAULT_FT_TOKEN_SYMBOL = "s" + GOV_TOKEN_SYMBOL

  // GOV STATE NFT
  GOV_STATE_NFT_POLICY_ID = state.constants.data.policy_ids.gov_state_nft
  GOV_STATE_NFT_TOKEN_NAME_HEX = state.constants.data.nfts.gov_state_nft

  // TALLY AUTH NFT
  TALLY_AUTH_NFT_POLICY_ID = state.constants.data.policy_ids.tally_auth_nft
  TALLY_AUTH_NFT_NAME_HEX = state.constants.data.nfts.gov_state_nft

  // TALLY AUTH SCRIPT REF
  TALLY_AUTH_NFT_SCRIPT_HASH = TALLY_AUTH_NFT_POLICY_ID
  TALLY_AUTH_NFT_REF_TRANSACTION_HASH =
    state.constants.data.reference_inputs.tally_auth_nft.tx_hash
  TALLY_AUTH_NFT_REF_INDEX =
    state.constants.data.reference_inputs.tally_auth_nft.index
  TALLY_AUTH_NFT_REF_SCRIPT_SIZE =
    state.constants.data.script_sizes.tally_auth_nft

  // STAKING SCRIPT DATA
  STAKING_ADDR = state.constants.data.addresses.staking
  STAKING_SCRIPT_HASH = state.constants.data.policy_ids.staking
  STAKING_REF_TRANSACTION_HASH =
    state.constants.data.reference_inputs.staking.tx_hash
  STAKING_REF_INDEX = state.constants.data.reference_inputs.staking.index
  STAKING_REF_SCRIPT_SIZE = state.constants.data.script_sizes.staking

  // TALLY SCRIPT DATA
  TALLY_ADDR = state.constants.data.addresses.tally
  TALLY_SCRIPT_HASH = state.constants.data.policy_ids.tally

  // VOTE PERMISSION
  VOTE_PERMISSION_NFT_SCRIPT_HASH =
    state.constants.data.policy_ids.vote_permission_nft
  VOTE_PERMISSION_NFT_REF_TRANSACTION_HASH =
    state.constants.data.reference_inputs.vote_permission_nft.tx_hash
  VOTE_PERMISSION_NFT_REF_INDEX =
    state.constants.data.reference_inputs.vote_permission_nft.index
  VOTE_PERMISSION_NFT_REF_SCRIPT_SIZE =
    state.constants.data.script_sizes.vote_permission_nft

  // GOV STATE DATA
  GOV_STATE_ADDR = state.constants.data.addresses.gov_state

  // GOV STATE SCRIPT REF
  GOV_STATE_SCRIPT_HASH = state.constants.data.policy_ids.gov_state
  GOV_STATE_REF_TRANSACTION_HASH =
    state.constants.data.reference_inputs.gov_state.tx_hash
  GOV_STATE_REF_INDEX = state.constants.data.reference_inputs.gov_state.index
  GOV_STATE_SCRIPT_SIZE = state.constants.data.script_sizes.gov_state

  // STAKING VOTE NFT
  STAKING_VOTE_NFT_POLICY_ID = state.constants.data.policy_ids.staking_vote_nft
  STAKING_VOTE_NFT_REF_TRANSACTION_HASH =
    state.constants.data.reference_inputs.staking_vote_nft.tx_hash
  STAKING_VOTE_NFT_REF_INDEX =
    state.constants.data.reference_inputs.staking_vote_nft.index
  STAKING_VOTE_NFT_REF_SCRIPT_SIZE =
    state.constants.data.script_sizes.staking_vote_nft
}
