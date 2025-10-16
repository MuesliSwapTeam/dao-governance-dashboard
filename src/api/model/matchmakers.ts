import { Proposal } from "./tally"

export interface matchmakeryEntry {
  addresses: string[]
  profit: {
    max_profit: number
    min_profit: number
    avg_profit: number
    total: number
  }
  status: "passed" | "pending"
  proposal: Proposal
}
