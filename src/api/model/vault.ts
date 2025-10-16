export interface VaultPosition {
  owner: string
  release_timestamp: number // unix in ms
  vault_ft_already_minted: boolean
  vault_address: string
  vault_name: string
  locked_amount: number
  transaction_hash: string
  output_index: number
}
