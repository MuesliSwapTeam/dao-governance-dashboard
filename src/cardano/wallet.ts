import {
  Value,
  ScriptHash,
  AssetName,
} from "@emurgo/cardano-serialization-lib-browser"
import { GOV_TOKEN_POLICY_ID, GOV_TOKEN_NAME_HEX } from "./config.ts"
import { fromHex } from "./utils/utils.ts"

import { toast } from "../components/ToastContainer.ts"

export function wrongNetworkToast() {
  toast({
    title: "Wrong Network",
    description: "Please switch to the Cardano Preprod network",
    status: "error" as "error",
    duration: 5000,
    isClosable: false,
  })
}

const WALLET_CONNECTOR_KEY = "wallet-connector-store"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let WALLET_CONNECTOR: any = undefined
export async function setWallet(connectorName: string | undefined) {
  if (connectorName != null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    WALLET_CONNECTOR = await (window as any).cardano[connectorName].enable()
    const networkId = await WALLET_CONNECTOR.getNetworkId()
    if (networkId === 1) {
      wrongNetworkToast()
      return
    }
    localStorage.setItem(WALLET_CONNECTOR_KEY, connectorName)
  } else {
    WALLET_CONNECTOR = undefined
    localStorage.removeItem(WALLET_CONNECTOR_KEY)
  }
}

export async function restoreWallet() {
  const connectorName = localStorage.getItem(WALLET_CONNECTOR_KEY)
  if (connectorName != null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    WALLET_CONNECTOR = await (window as any).cardano[connectorName].enable()
    const networkId = await WALLET_CONNECTOR.getNetworkId()
    if (networkId === 1) {
      wrongNetworkToast()
      return false
    }
    return true
  }
  return false
}

export async function getWallet() {
  return WALLET_CONNECTOR
}

export async function getGovernanceTokenBalance() {
  return getTokenBalance(GOV_TOKEN_POLICY_ID, GOV_TOKEN_NAME_HEX)
}

const CACHE_TIMEOUT = 3000
const BALANCE_CACHE: {
  [key: string]: {
    value: string
    time: number
  }
} = {}

export async function getTokenBalance(
  tokenPolicyId: string,
  tokenNameHex: string,
) {
  const key = `${tokenPolicyId}.${tokenNameHex}`
  if (
    BALANCE_CACHE[key] != null &&
    Date.now() < BALANCE_CACHE[key].time + CACHE_TIMEOUT
  ) {
    return BALANCE_CACHE[key].value
  }

  const wallet = await getWallet()
  const balances = await wallet?.getBalance()

  if (!balances) return "0"

  const values = Value.from_hex(balances)
  const scriptHashPolicyId = ScriptHash.from_hex(tokenPolicyId)
  const assetName = AssetName.new(fromHex(tokenNameHex))

  const balance =
    values.multiasset()?.get(scriptHashPolicyId)?.get(assetName)?.to_str() ??
    "0"

  BALANCE_CACHE[key] = {
    time: Date.now(),
    value: balance,
  }

  return balance
}

export async function getWalletAddresses() {
  const wallet = await getWallet()
  const usedAddresses = await wallet.getUsedAddresses()
  const unusedAddresses = await wallet.getUnusedAddresses()

  return [...usedAddresses, ...unusedAddresses]
}

export async function getWalletAddress() {
  const wallet = await getWallet()
  const usedAddresses = await wallet.getUsedAddresses()
  if (usedAddresses.length) return usedAddresses[0]

  const unusedAddresses = await wallet.getUnusedAddresses()
  return unusedAddresses[0]
}
