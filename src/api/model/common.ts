export interface Token {
  policy_id: string
  asset_name: string
}

export interface Asset extends Token {
  amount: string
}
