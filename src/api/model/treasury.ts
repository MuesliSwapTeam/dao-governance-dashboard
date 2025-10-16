import { Token } from "./common"

export interface TreasuryAsset extends Token {
  amount: string
  decimalPlaces: number
  symbol: string
  image: string
  eqAmountLvl: string
}

export interface TreasuryHistoryItem {
  slot: number
  transaction_hash: string
  block_index: number
  payout: {
    transaction_hash: string
    output_index: string
  } | null
  tally_id: {
    transaction_hash: string
    output_index: string
  } | null
  delta: TreasuryAsset[]
  timestamp: string
  action: "payout" | "deposit" | "consolidate"
}

export interface TreasuryPayoutDatumConstructionRequest {
  address: string
  value: { [unit: string]: number }[]
}

export type TreasuryChartItem = { timestamp: string; funds: TreasuryAsset[] }
