import { DEBUG } from "../config"

export class BfError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`Blockfrost request failed with status code: ${status}`)
    this.status = status
  }
}

export interface BfOptions<T> {
  baseUrl?: string
  notFoundValue?: T
  body?: object
}

export async function blockfrostRequest<T>(
  projectId: string,
  path: string,
  options?: BfOptions<T>,
): Promise<T> {
  const base_url = options?.baseUrl ?? "cardano-mainnet.blockfrost.io/api/v0"
  const notFoundValue = options?.notFoundValue
  const body = options?.body

  const result = await fetch(`https://${base_url}/${path}`, {
    headers: { project_id: projectId },
    method: body ? "POST" : "GET",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: body as any,
  })
  if (result.ok) {
    const json = await result.json()
    if (DEBUG) {
      console.log(json)
    }
    return json
  } else {
    if (notFoundValue != null && result.status === 404) {
      return notFoundValue
    }
    throw new BfError(result.status)
  }
}

export interface BfUtxo {
  address: string
  tx_hash: string
  output_index: number
  amount: { unit: string; quantity: number }[]
  block: string
  data_hash?: string
  inline_datum: string
  reference_script_hash?: string
}
