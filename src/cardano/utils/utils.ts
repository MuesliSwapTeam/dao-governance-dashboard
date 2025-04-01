import { Buffer } from "buffer"
import {
  BigNum,
  UnitInterval,
  ExUnitPrices,
  TransactionBuilderConfigBuilder,
  LinearFee,
  TransactionBuilder,
  Address,
  TransactionOutput,
  DataCost,
  min_ada_for_output,
  PlutusData,
  MultiAsset,
  Assets,
  AssetName,
  Value,
  ScriptHash,
  Transaction,
  TransactionWitnessSet,
  PlutusMap,
  BigInt,
  TransactionUnspentOutputs,
  TransactionUnspentOutput,
  PlutusMapValues,
  hash_plutus_data,
} from "@emurgo/cardano-serialization-lib-browser"
import Fraction from "fraction.js"
import { sha256 } from "js-sha256"
import { toast } from "../../components/ToastContainer"

export function fromHex(hex: string) {
  return Buffer.from(hex, "hex")
}

export function toHex(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("hex")
}

async function blockfrostRequest(endpoint: string) {
  return await fetch(
    "https://cardano-preprod.blockfrost.io/api/v0" + endpoint,
    {
      headers: {
        project_id: "preprodjgdbXRrz6gH0hTST2Bx2C5bRqNKFq9ub",
        "User-Agent": "muesliswap",
      },
      method: "GET",
    },
  ).then((res) => res.json())
}

export async function getProtocolParameters() {
  // const p = await muesliRequest(`/chain/epoch-parameters`)
  const p = await blockfrostRequest(`/epochs/latest/parameters`)

  const protocolParameters = {
    linearFee: {
      minFeeA: p.min_fee_a.toString(),
      minFeeB: p.min_fee_b.toString(),
    },
    minUtxo: "1000000",
    coinsPerUtxoByte: p.coins_per_utxo_word,
    refScriptFeeByte: parseInt(p.min_fee_ref_script_cost_per_byte),
    poolDeposit: p.pool_deposit,
    keyDeposit: p.key_deposit,
    maxValSize: parseInt(p.max_val_size),
    maxTxSize: parseInt(p.max_tx_size),
    priceMem: parseFloat(p.price_mem),
    priceStep: parseFloat(p.price_step),
    costModels: Object.fromEntries(
      Object.entries(p.cost_models).map(([k, m]) => [
        k,
        Object.values(m as (Number | String)[]).map((v) => v.toString()),
      ]),
    ),
  }

  return protocolParameters
}

interface protocolParameterType {
  linearFee: {
    minFeeA: string
    minFeeB: string
  }
  minUtxo: string
  coinsPerUtxoByte: any
  refScriptFeeByte: number
  poolDeposit: any
  keyDeposit: any
  maxValSize: number
  maxTxSize: number
  priceMem: number
  priceStep: number
  costModels: {
    [modelName: string]: {
      [paramName: string]: any
    }
  }
}

export async function getTXBuilder(protocolParameters: protocolParameterType) {
  const priceMemFranction = new Fraction(protocolParameters.priceMem)
  const priceMemFranctionNumerator = BigNum.from_str(
    priceMemFranction.n.toString(),
  )
  const priceMemFranctionDenominator = BigNum.from_str(
    priceMemFranction.d.toString(),
  )
  const priceMem = UnitInterval.new(
    priceMemFranctionNumerator,
    priceMemFranctionDenominator,
  )

  const priceStepFranction = new Fraction(protocolParameters.priceStep)
  const priceStepFranctionNumerator = BigNum.from_str(
    priceStepFranction.n.toString(),
  )
  const priceStepFranctionDenominator = BigNum.from_str(
    priceStepFranction.d.toString(),
  )

  const priceStep = UnitInterval.new(
    priceStepFranctionNumerator,
    priceStepFranctionDenominator,
  )

  const exUnitPrices = ExUnitPrices.new(priceMem, priceStep)

  // TODO: figure out how to get the param for coins_per_utxo_byte directly
  const coinsPerUtxoByte = Math.ceil(
    Number(protocolParameters.coinsPerUtxoByte),
  )

  // used protocolParameters.coinsPerUtxoWord instead of '100'
  const txBuilderConfig = TransactionBuilderConfigBuilder.new()
    .coins_per_utxo_byte(BigNum.from_str(coinsPerUtxoByte.toString()))
    .fee_algo(
      LinearFee.new(
        BigNum.from_str(protocolParameters.linearFee.minFeeA),
        BigNum.from_str(
          Number(protocolParameters.linearFee.minFeeB).toString(),
        ),
      ),
    )
    .key_deposit(BigNum.from_str(protocolParameters.keyDeposit))
    .pool_deposit(BigNum.from_str(protocolParameters.poolDeposit))
    .max_tx_size(protocolParameters.maxTxSize)
    .max_value_size(protocolParameters.maxValSize)
    .ex_unit_prices(exUnitPrices)
    .prefer_pure_change(false)
    .ref_script_coins_per_byte(
      UnitInterval.new(
        BigNum.from_str(protocolParameters.refScriptFeeByte.toString()),
        BigNum.from_str("1"),
      ),
    )
    .build()

  const txBuilder = TransactionBuilder.new(txBuilderConfig)
  return txBuilder
}

export function assetsToValue(assets: { unit: string; quantity: number }[]) {
  const multiAsset = MultiAsset.new()
  const lovelace = assets.find(
    (asset) => asset.unit === "lovelace" || asset.unit === "",
  )
  const policies = [
    ...new Set(
      assets
        .filter((asset) => asset.unit !== "lovelace" && asset.unit !== "")
        .map((asset) => asset.unit.slice(0, 56)),
    ),
  ]
  policies.forEach((policy) => {
    const policyAssets = assets.filter(
      (asset) => asset.unit.slice(0, 56) === policy,
    )
    const assetsValue = Assets.new()
    policyAssets.forEach((asset) => {
      assetsValue.insert(
        AssetName.new(Buffer.from(asset.unit.slice(56), "hex")),
        BigNum.from_str(asset.quantity.toString()),
      )
    })
    multiAsset.insert(
      ScriptHash.from_bytes(Buffer.from(policy, "hex")),
      assetsValue,
    )
  })
  const value = Value.new(
    BigNum.from_str(lovelace ? lovelace.quantity.toString() : "0"),
  )
  if (assets.length > 1 || !lovelace) value.set_multiasset(multiAsset)
  return value
}

export function createOutputInlineDatum(
  address: Address,
  value: Value,
  datum: PlutusData,
): TransactionOutput {
  const v = value

  const output = TransactionOutput.new(address, v)

  if (datum) {
    output.set_plutus_data(datum)
  }

  // TODO: replace with correct parameter value
  const dataCost = DataCost.new_coins_per_byte(BigNum.from_str("4310"))
  const minAda = min_ada_for_output(output, dataCost)

  if (minAda.compare(v.coin()) == 1) v.set_coin(minAda)

  const outputFinal = TransactionOutput.new(address, v)

  if (datum) {
    outputFinal.set_plutus_data(datum)
  }

  return outputFinal
}

export function createOutputDatumHash(
  address: Address,
  value: Value,
  datum: PlutusData,
): TransactionOutput {
  const v = value

  const output = TransactionOutput.new(address, v)

  const datumHash = hash_plutus_data(datum)

  if (datum) {
    output.set_data_hash(datumHash)
  }

  // TODO: replace with correct parameter value
  const dataCost = DataCost.new_coins_per_byte(BigNum.from_str("4310"))
  const minAda = min_ada_for_output(output, dataCost)

  if (minAda.compare(v.coin()) == 1) v.set_coin(minAda)

  const outputFinal = TransactionOutput.new(address, v)

  if (datum) {
    outputFinal.set_data_hash(datumHash)
  }

  return outputFinal
}

export function getSha256HashByte(text: Uint8Array): string {
  const hash = sha256.update(text)
  return hash.hex()
}

export async function signSubmitTx(
  wallet: any,
  unsignedTransaction: Transaction,
) {
  let txVkeyWitnesses, signError
  try {
    txVkeyWitnesses = await wallet.signTx(unsignedTransaction.to_hex(), true)
  } catch (error) {
    signError = error
  }

  if (!txVkeyWitnesses || signError) {
    toast({
      title: "Stake Error",
      description: `Signing failed. Did you cancel the sign request?`,
      status: "error",
      duration: 5000,
      isClosable: true,
    })
    return Promise.reject(`An error occurred: \n${signError}`)
  }

  txVkeyWitnesses = TransactionWitnessSet.from_hex(txVkeyWitnesses)

  const witnessSet = unsignedTransaction.witness_set()
  witnessSet.set_vkeys(txVkeyWitnesses.vkeys()!)

  const signedTx = Transaction.new(
    unsignedTransaction.body(),
    witnessSet,
    unsignedTransaction.auxiliary_data(),
  )

  try {
    const txHash = await wallet.submitTx(signedTx.to_hex())
    console.log("Stake TxHash", txHash)
    toast({
      title: "Tokens staked",
      description: "Tokens successfully staked.",
      status: "success",
      duration: 5000,
      isClosable: true,
    })
    return txHash
  } catch (error) {
    console.error("Stake Error", error)
    toast({
      title: "Stake Error",
      description: `Error received:\n${error}`,
      status: "error",
      duration: 5000,
      isClosable: true,
    })
    return Promise.reject(`An error occurred: \n${error}`)
  }
}

interface SlotConfig {
  zeroTime: number
  zeroSlot: number
  slotLength: number
}

export const SLOT_CONFIG_NETWORK: { [key: string]: SlotConfig } = {
  Mainnet: { zeroTime: 1596059091000, zeroSlot: 4492800, slotLength: 1000 }, // Starting at Shelley era
  Preview: { zeroTime: 1666656000000, zeroSlot: 0, slotLength: 1000 }, // Starting at Shelley era
  Preprod: {
    zeroTime: 1654041600000 + 1728000000,
    zeroSlot: 86400,
    slotLength: 1000,
  },
  Custom: { zeroTime: 0, zeroSlot: 0, slotLength: 0 },
}

function unixTimeToEnclosingSlot(
  unixTime: number,
  slotConfig: SlotConfig,
): number {
  const timePassed = unixTime - slotConfig.zeroTime
  const slotsPassed = Math.floor(timePassed / slotConfig.slotLength)
  return slotsPassed + slotConfig.zeroSlot
}

export function unixTimeToSlot(unixTime: number): number {
  return unixTimeToEnclosingSlot(unixTime, SLOT_CONFIG_NETWORK["Preprod"])
}

// Function to convert Value to PlutusData
export function valueToPlutusData(value: Value): PlutusData {
  // They are only there so I could get the build working
  const multiassetMap = PlutusMap.new()

  // Handle Lovelace (ADA) separately
  const adaKey = PlutusData.new_bytes(Buffer.from("")) // Empty bytes for Lovelace
  const adaMap = PlutusMap.new()
  adaMap.insert(
    PlutusData.new_bytes(Buffer.from("")),
    PlutusData.new_integer(
      BigInt.from_str(value.coin().to_str()),
    ) as unknown as PlutusMapValues,
  )
  multiassetMap.insert(
    adaKey,
    PlutusData.new_map(adaMap) as unknown as PlutusMapValues,
  )

  // Handle other assets if any
  const multiasset = value.multiasset()
  if (multiasset) {
    const multiassetKeys = multiasset.keys() // Retrieving keys of multiassets
    for (let i = 0; i < multiassetKeys.len(); i++) {
      const scriptHash = multiassetKeys.get(i)
      const assets = multiasset.get(scriptHash)
      if (assets === undefined) continue

      const assetKeys = assets.keys()

      const assetMap = PlutusMap.new()
      for (let j = 0; j < assetKeys.len(); j++) {
        const assetName = assetKeys.get(j)
        const assetValue = assets.get(assetName)

        if (assetValue === undefined) continue

        assetMap.insert(
          PlutusData.new_bytes(assetName.name()), // Convert AssetName to bytes
          PlutusData.new_integer(
            BigInt.from_bytes(assetValue.to_bytes()),
          ) as unknown as PlutusMapValues, // Convert value to BigInt
        )
      }
      multiassetMap.insert(
        PlutusData.new_bytes(scriptHash.to_bytes()), // Convert ScriptHash to bytes
        PlutusData.new_map(assetMap) as unknown as PlutusMapValues, // Insert asset map
      )
    }
  }

  return PlutusData.new_map(multiassetMap)
}

export async function selectInputUtxos(wallet: any, minAdaRequired: number) {
  const utxos = TransactionUnspentOutputs.new()
  const allUtxos: string[] = await wallet.getUtxos()
  const sortedUtxos = allUtxos
    .map((utxoString) =>
      TransactionUnspentOutput.from_bytes(fromHex(utxoString)),
    )
    .sort(
      (a, b) =>
        parseInt(b.output().amount().coin().to_str()) -
        parseInt(a.output().amount().coin().to_str()),
    )

  let totalAdaCount = 0

  for (const utxo of sortedUtxos) {
    utxos.add(utxo)
    totalAdaCount += Number(utxo.output().amount().coin().to_str())

    if (totalAdaCount >= minAdaRequired) break
  }

  if (totalAdaCount < minAdaRequired) {
    toast({
      title: "Tally Creation Error",
      description: `You don't have enough ADA to create a Tally.`,
      status: "error",
      duration: 5000,
      isClosable: true,
    })
    return Promise.reject(`An error occurred: \n Insufficient ADA`)
  }

  return utxos
}
