export interface BatcherMonitoringData {
  num_transactions: number
  addresses: string[]
}

export interface BatcherStats {
  max_profit: number
  min_profit: number
  avg_profit: number
  avg_processing_time: number
  total_profit: number
}

export interface BatcherTransaction {
  tx_hash: string
  ada_profit: number
  non_ada_profit: number
  other_assets: Record<string, any>
}

export interface BatcherAllStats {
  max_profit: number
  min_profit: number
  avg_profit: number
  avg_processing_time: number
  total_profit: number
  num_transactions: number
  addresses: string[]
}

export interface EnhancedMonitoringEntry {
  batcher_address: string
  num_transactions: number
  status: "active" | "inactive"
  max_profit?: number
  min_profit?: number
  avg_profit?: number
  avg_processing_time?: number
  total_profit?: number
  performance_status?: "excellent" | "good" | "average" | "poor"
  profit_status?: "profitable" | "mixed" | "losing"
}

export interface MonitoringEntry {
  batcher_address: string
  num_transactions: number
  status: "active" // All monitored batchers are considered active
}
