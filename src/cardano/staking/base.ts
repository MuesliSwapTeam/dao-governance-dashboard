import {
  TransactionOutputs,
  BaseAddress,
  Address,
  TransactionUnspentOutput,
  Ed25519KeyHash,
  TransactionInput,
  TransactionHash,
  TransactionOutput,
  PlutusScriptSource,
  DatumSource,
  PlutusWitness,
  Costmdls,
  RedeemerTag,
  BigNum,
  ExUnits,
  Redeemer,
  TransactionWitnessSet,
  Transaction,
  PlutusList,
  PlutusData,
  MintBuilder,
  MintWitness,
  AssetName,
  Int,
  ScriptHash,
  Language,
} from "@emurgo/cardano-serialization-lib-browser"
import {
  GOV_TOKEN_POLICY_ID,
  GOV_TOKEN_NAME_HEX,
  VAULT_FT_TOKEN_POLICY_ID,
  TALLY_AUTH_NFT_POLICY_ID,
  TALLY_AUTH_NFT_NAME_HEX,
  STAKING_SCRIPT_HASH,
  STAKING_REF_TRANSACTION_HASH,
  STAKING_REF_INDEX,
  STAKING_REF_SCRIPT_SIZE,
  STAKING_ADDR,
  STAKING_VOTE_NFT_POLICY_ID,
  STAKING_VOTE_NFT_REF_TRANSACTION_HASH,
  STAKING_VOTE_NFT_REF_INDEX,
  STAKING_VOTE_NFT_REF_SCRIPT_SIZE,
  VOTE_PERMISSION_NFT_SCRIPT_HASH,
  VOTE_PERMISSION_NFT_REF_TRANSACTION_HASH,
  VOTE_PERMISSION_NFT_REF_INDEX,
  VOTE_PERMISSION_NFT_REF_SCRIPT_SIZE,
  GOV_TOKEN_DECIMALS,
} from "../config.ts"
import {
  fromHex,
  getTXBuilder,
  getProtocolParameters,
  assetsToValue,
  createOutputInlineDatum,
  unixTimeToSlot,
  buildCollateralInputs,
} from "../utils/utils.ts"
import { CoinSelection } from "../utils/coinSelection.js"
import { getWallet, getWalletAddress } from "../wallet.ts"
import {
  Participation,
  ReducedProposalParams,
  StakingParams,
  StakingState,
} from "../types/data.ts"
import { AddressBaseType, EmptyList, TokenBaseType } from "../types/basic.ts"
import {
  WithdrawFunds,
  StakingVoteNFTBurnRedeemer,
  AddFunds,
} from "../types/redeemer.ts"
import { signSubmitTx } from "../utils/utils.ts"
import { toast } from "../../components/ToastContainer.ts"
import { Participation as ParticipationInterface } from "../../api/model/staking.ts"
import { StakingPosition } from "../../api/model/staking"
import { convertToValue } from "../../cardano/utils/utils.ts"
import { getVaultFTs, unsignedIntFromTokenname } from "../wallet.ts"

function buildParticipation(
  endTimeProposal: string,
  proposalId: string,
  weight: string,
  proposalIndex: string,
) {
  const posixTime = {
    negInfBool: false,
    time: endTimeProposal,
    posInfBool: endTimeProposal == undefined ? true : false,
  }

  const tallyAuthNft: TokenBaseType = {
    tokenPolicyId: TALLY_AUTH_NFT_POLICY_ID,
    tokenNameHex: TALLY_AUTH_NFT_NAME_HEX,
  }

  const govToken: TokenBaseType = {
    tokenPolicyId: GOV_TOKEN_POLICY_ID,
    tokenNameHex: GOV_TOKEN_NAME_HEX,
  }

  const tallyParams = ReducedProposalParams(
    posixTime,
    proposalId,
    tallyAuthNft,
    STAKING_VOTE_NFT_POLICY_ID,
    govToken,
    VAULT_FT_TOKEN_POLICY_ID,
  )

  const participation = Participation(tallyParams, weight, proposalIndex)
  return participation
}

export function buildStakingState(
  walletAddress: BaseAddress | undefined,
  participations: ParticipationInterface[] | undefined,
) {
  const pubKeyHash = walletAddress?.payment_cred().to_keyhash()?.to_hex() ?? ""
  const stakeKeyHash = walletAddress?.stake_cred().to_keyhash()?.to_hex() ?? ""

  // List of objects

  let participationList = undefined

  if (participations === undefined) {
    participationList = EmptyList()
  } else {
    const list = PlutusList.new()

    for (var participation of participations) {
      const participationObject = buildParticipation(
        participation.end_time,
        participation.proposal_id,
        participation.weight,
        participation.proposal_index.toString(),
      )

      list.add(participationObject)
    }

    participationList = PlutusData.new_list(list)
  }

  const owner: AddressBaseType = {
    isScript: false,
    pubKeyHash: pubKeyHash,
    stakeKeyHash: stakeKeyHash,
  }

  const govToken: TokenBaseType = {
    tokenPolicyId: GOV_TOKEN_POLICY_ID,
    tokenNameHex: GOV_TOKEN_NAME_HEX,
  }

  const tallyAuthNft: TokenBaseType = {
    tokenPolicyId: TALLY_AUTH_NFT_POLICY_ID,
    tokenNameHex: TALLY_AUTH_NFT_NAME_HEX,
  }

  const stakingParams = StakingParams(
    owner,
    govToken,
    VAULT_FT_TOKEN_POLICY_ID,
    tallyAuthNft,
  )

  const stakingState = StakingState(participationList, stakingParams)
  return stakingState
}

function buildWithdrawRedeemer(stateInputIdx: string, stateOutputIdx: string) {
  const redeemerData = WithdrawFunds(stateInputIdx, stateOutputIdx)

  const redeemer = Redeemer.new(
    RedeemerTag.new_spend(),
    BigNum.from_str("0"),
    redeemerData,
    ExUnits.new(BigNum.from_str("650000"), BigNum.from_str("150000000")),
  )

  return redeemer
}

function buildAddFundsRedeemer(stateInputIdx: string, stateOutputIdx: string) {
  const redeemerData = AddFunds(stateInputIdx, stateOutputIdx)

  const redeemer = Redeemer.new(
    RedeemerTag.new_spend(),
    BigNum.from_str("0"),
    redeemerData,
    ExUnits.new(BigNum.from_str("2000000"), BigNum.from_str("700000000")),
  )

  return redeemer
}

function buildDummyBurnRedeemer() {
  const redeemerData = EmptyList()

  const redeemer = Redeemer.new(
    RedeemerTag.new_mint(),
    BigNum.from_str("0"),
    redeemerData,
    // ExUnits.new(BigNum.from_str("10000"), BigNum.from_str("10000000")),
    ExUnits.new(BigNum.from_str("100000"), BigNum.from_str("100000000")),
  )

  return redeemer
}

function buildBurnVoteNFTRedeemer() {
  const redeemerData = StakingVoteNFTBurnRedeemer()

  const redeemer = Redeemer.new(
    RedeemerTag.new_mint(),
    BigNum.from_str("0"),
    redeemerData,
    ExUnits.new(BigNum.from_str("150000"), BigNum.from_str("50000000")),
  )

  return redeemer
}

export async function lockTokens(
  governanceTokenAmount: number,
  ftTokenAmount?: number,
) {
  const wallet = await getWallet()
  const protocolParameters = await getProtocolParameters()

  const txBuilder = await getTXBuilder(protocolParameters)

  const walletAddress = BaseAddress.from_address(
    Address.from_hex(await getWalletAddress()),
  )

  const utxos = (await wallet.getUtxos()).map((utxo: string) =>
    TransactionUnspentOutput.from_bytes(fromHex(utxo)),
  )

  const datum = buildStakingState(walletAddress, undefined)

  const assets = []
  if (governanceTokenAmount > 0)
    assets.push({
      unit: GOV_TOKEN_POLICY_ID + GOV_TOKEN_NAME_HEX,
      quantity: governanceTokenAmount,
    })

  const vaultFTs = await getVaultFTs()
  let ftRunningCount = 0
  const targetFtAmount = (ftTokenAmount || 0) * Math.pow(10, GOV_TOKEN_DECIMALS)

  // Sort vault FTs by expiry date (latest first)
  const sortedVaultFTs = Object.entries(vaultFTs).sort(
    ([tokenNameHexA], [tokenNameHexB]) => {
      const expiryA = unsignedIntFromTokenname(tokenNameHexA)
      const expiryB = unsignedIntFromTokenname(tokenNameHexB)
      return expiryB - expiryA // Sort in descending order (latest first)
    },
  )

  for (const [tokenNameHex, amount] of sortedVaultFTs) {
    if (Number(amount) > 0) {
      if (ftTokenAmount === undefined) {
        // If no ftTokenAmount specified, include all FTs (original behavior)
        assets.push({
          unit: VAULT_FT_TOKEN_POLICY_ID + tokenNameHex,
          quantity: Number(amount),
        })
      } else if (ftRunningCount < targetFtAmount) {
        // Only include FTs up to the specified amount
        const remainingNeeded = targetFtAmount - ftRunningCount
        const amountToUse = Math.min(Number(amount), remainingNeeded)

        if (amountToUse > 0) {
          assets.push({
            unit: VAULT_FT_TOKEN_POLICY_ID + tokenNameHex,
            quantity: amountToUse,
          })
          ftRunningCount += amountToUse
        }
      }
    }
  }

  assets.push({ unit: "lovelace", quantity: 5e6 })

  const scriptOutputAddr = Address.from_bech32(STAKING_ADDR)

  const scriptOutput = createOutputInlineDatum(
    scriptOutputAddr,
    assetsToValue(assets),
    datum,
  )

  txBuilder.add_output(scriptOutput)

  const outputs = TransactionOutputs.new()
  outputs.add(scriptOutput)

  CoinSelection.setProtocolParameters(
    protocolParameters.minUtxo,
    protocolParameters.linearFee.minFeeA,
    protocolParameters.linearFee.minFeeB,
    protocolParameters.maxTxSize.toString(),
    protocolParameters.coinsPerUtxoByte.toString(),
  )

  const { input } = CoinSelection.randomImprove(utxos, outputs, 14, undefined)

  input.forEach((utxo: TransactionUnspentOutput) => {
    txBuilder.add_regular_input(
      utxo.output().address(),
      utxo.input(),
      utxo.output().amount(),
    )
  })

  txBuilder.add_change_if_needed(
    walletAddress?.to_address() ??
      Address.from_bech32(
        "addr1wxz7cdmk247jlrkz6zmtlycpmzejkmq2h7ne2shx3eguzuqnwn9z3",
      ),
  )

  const unsignedTransaction = txBuilder.build_tx()

  return signSubmitTx(wallet, unsignedTransaction)
}

export async function lockTokensContinuation(
  position: StakingPosition,
  governanceTokenAmount: number,
  ftTokenAmount?: number,
) {
  let tx_inputs: string[] = []

  const wallet = await getWallet()
  const protocolParameters = await getProtocolParameters()

  const txBuilder = await getTXBuilder(protocolParameters)

  const walletAddress = BaseAddress.from_address(
    Address.from_hex(await getWalletAddress()),
  )

  txBuilder.add_required_signer(
    Ed25519KeyHash.from_bytes(
      walletAddress?.payment_cred()?.to_keyhash()?.to_bytes() ?? fromHex(""),
    ),
  )

  const utxos = (await wallet.getUtxos()).map((utxo: string) =>
    TransactionUnspentOutput.from_bytes(fromHex(utxo)),
  )

  const datum = buildStakingState(walletAddress, position.participations)

  const requiredAssets = []
  if (governanceTokenAmount > 0)
    requiredAssets.push({
      unit: GOV_TOKEN_POLICY_ID + GOV_TOKEN_NAME_HEX,
      quantity: governanceTokenAmount,
    })

  const vaultFTs = await getVaultFTs()
  let ftRunningCount = 0
  const targetFtAmount = (ftTokenAmount || 0) * Math.pow(10, GOV_TOKEN_DECIMALS)

  console.log("Vault FTs in lockTokensContinuation:", vaultFTs)
  console.log("Target FT Amount:", targetFtAmount)

  // Sort vault FTs by expiry date (latest first)
  const sortedVaultFTs = Object.entries(vaultFTs).sort(
    ([tokenNameHexA], [tokenNameHexB]) => {
      const expiryA = unsignedIntFromTokenname(tokenNameHexA)
      const expiryB = unsignedIntFromTokenname(tokenNameHexB)
      return expiryB - expiryA // Sort in descending order (latest first)
    },
  )

  for (const [tokenNameHex, amount] of sortedVaultFTs) {
    if (Number(amount) > 0) {
      if (ftTokenAmount === undefined) {
        // If no ftTokenAmount specified, include all FTs (original behavior)
        requiredAssets.push({
          unit: VAULT_FT_TOKEN_POLICY_ID + tokenNameHex,
          quantity: Number(amount),
        })
      } else if (ftRunningCount < targetFtAmount) {
        // Only include FTs up to the specified amount
        const remainingNeeded = targetFtAmount - ftRunningCount
        const amountToUse = Math.min(Number(amount), remainingNeeded)

        if (amountToUse > 0) {
          requiredAssets.push({
            unit: VAULT_FT_TOKEN_POLICY_ID + tokenNameHex,
            quantity: amountToUse,
          })
          ftRunningCount += amountToUse
        }
      }
    }
  }

  console.log("Required Assets in lockTokensContinuation:", requiredAssets)

  const scriptAddr = Address.from_bech32(STAKING_ADDR)
  let valuesAttached = convertToValue(position.funds)
  const contractUtxo = TransactionUnspentOutput.new(
    TransactionInput.new(
      TransactionHash.from_bytes(fromHex(position.transaction_hash)),
      Number(position.output_index),
    ),
    TransactionOutput.new(scriptAddr, assetsToValue(valuesAttached)),
  )

  tx_inputs.push(contractUtxo.input().to_hex())

  const scriptHash = ScriptHash.from_hex(STAKING_SCRIPT_HASH)
  const refInput = TransactionInput.new(
    TransactionHash.from_hex(STAKING_REF_TRANSACTION_HASH),
    STAKING_REF_INDEX,
  )

  const scriptSource = PlutusScriptSource.new_ref_input(
    scriptHash,
    refInput,
    Language.new_plutus_v2(),
    STAKING_REF_SCRIPT_SIZE,
  )

  const requiredValue = assetsToValue(requiredAssets)

  const continuingAssets =
    assetsToValue(valuesAttached).checked_add(requiredValue)

  const scriptOutput = createOutputInlineDatum(
    scriptAddr,
    continuingAssets,
    datum,
  )

  txBuilder.add_output(scriptOutput)

  const outputs = TransactionOutputs.new()
  outputs.add(scriptOutput)

  console.log("Required Value:", requiredValue.to_json())

  CoinSelection.setProtocolParameters(
    protocolParameters.minUtxo,
    protocolParameters.linearFee.minFeeA,
    protocolParameters.linearFee.minFeeB,
    protocolParameters.maxTxSize.toString(),
    protocolParameters.coinsPerUtxoByte.toString(),
  )

  const { input } = CoinSelection.randomImprove(utxos, requiredValue, 14)

  input.forEach((utxo: TransactionUnspentOutput) => {
    txBuilder.add_regular_input(
      utxo.output().address(),
      utxo.input(),
      utxo.output().amount(),
    )
    tx_inputs.push(utxo.input().to_hex())
  })

  tx_inputs.sort()

  const contractUtxoIdx = tx_inputs.findIndex(
    (input) => input === contractUtxo.input().to_hex(),
  )

  const redeemer = buildAddFundsRedeemer(contractUtxoIdx.toString(), "0")
  const datumSource = DatumSource.new_ref_input(contractUtxo.input())
  const plutusWitness = PlutusWitness.new_with_ref(
    scriptSource,
    datumSource,
    redeemer,
  )

  txBuilder.add_plutus_script_input(
    plutusWitness,
    contractUtxo.input(),
    contractUtxo.output().amount(),
  )

  // Calculate script data hash
  const costmdls = Costmdls.from_json(
    JSON.stringify(protocolParameters.costModels),
  )
  txBuilder.calc_script_data_hash(costmdls)

  const collateralInputs = await buildCollateralInputs(
    wallet,
    "Cancel Request Error",
  )
  txBuilder.set_collateral(collateralInputs)

  txBuilder.add_change_if_needed(
    walletAddress?.to_address() ??
      Address.from_bech32(
        "addr1wxz7cdmk247jlrkz6zmtlycpmzejkmq2h7ne2shx3eguzuqnwn9z3",
      ),
  )

  const unsignedTransaction = txBuilder.build_tx()

  let txVkeyWitnesses, signError
  try {
    txVkeyWitnesses = await wallet.signTx(unsignedTransaction.to_hex(), true)
  } catch (error) {
    signError = error
  }

  if (!txVkeyWitnesses || signError) {
    toast({
      title: "Cancel Request Error",
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

  console.log(signedTx.to_hex())

  try {
    const txHash = await wallet.submitTx(signedTx.to_hex())
    console.log("Staking Increase TxHash", txHash)
    toast({
      title: "Increase Stake Request",
      description: "Increase stake submitted successfully.",
      status: "success",
      duration: 5000,
      isClosable: true,
    })
    return txHash
  } catch (error) {
    console.error("Staking Increase Error", error)
    toast({
      title: "Increase Request Error",
      description: `Error received:\n${error}`,
      status: "error",
      duration: 5000,
      isClosable: true,
    })
    return Promise.reject(`An error occurred: \n${error}`)
  }
}

export async function unlockTokens(
  txHash: string,
  outputIdx: string,
  valuesAttached: { unit: string; quantity: number }[],
  participations: ParticipationInterface[],
  _datum?: string,
  unlockGovAmount?: number,
  unlockFTOption: "all" | "expired" | "none" = "expired",
) {
  let tx_inputs: string[] = []

  const govIsMax =
    unlockGovAmount == null ||
    valuesAttached.some(
      (x) =>
        x.unit === GOV_TOKEN_POLICY_ID + GOV_TOKEN_NAME_HEX &&
        x.quantity === unlockGovAmount * 10 ** GOV_TOKEN_DECIMALS,
    ) ||
    (unlockGovAmount === 0 &&
      valuesAttached.every(
        (x) => x.unit !== GOV_TOKEN_POLICY_ID + GOV_TOKEN_NAME_HEX,
      ))

  let continuingVaultFT: { unit: string; quantity: number }[] = []
  let vaultFTAttachedValues = valuesAttached.filter(
    (x) => x.unit.slice(0, 56) === VAULT_FT_TOKEN_POLICY_ID,
  )

  if (unlockFTOption === "none") continuingVaultFT = vaultFTAttachedValues
  else if (unlockFTOption === "expired") {
    const currentUnixTimeMS = Date.now()
    for (const ft of vaultFTAttachedValues) {
      if (unsignedIntFromTokenname(ft.unit.slice(56)) > currentUnixTimeMS) {
        continuingVaultFT.push(ft)
      }
    }
  }

  const withdrawingAll = govIsMax && continuingVaultFT.length === 0

  let continuingAttachedValue: { unit: string; quantity: number }[] = []

  // Calculate the attached value of the next staking output
  if (!withdrawingAll) {
    continuingAttachedValue = valuesAttached
      .map((asset) => {
        if (
          asset.unit === GOV_TOKEN_POLICY_ID + GOV_TOKEN_NAME_HEX &&
          unlockGovAmount
        ) {
          return {
            unit: asset.unit,
            quantity:
              asset.quantity - unlockGovAmount * 10 ** GOV_TOKEN_DECIMALS,
          }
        }
        if (asset.unit.slice(0, 56) === VOTE_PERMISSION_NFT_SCRIPT_HASH) {
          return { unit: asset.unit, quantity: 0 }
        }
        if (asset.unit.slice(0, 56) === VAULT_FT_TOKEN_POLICY_ID) {
          // These are handled separately above
          return { unit: asset.unit, quantity: 0 }
        }
        return asset
      })
      .filter((asset) => asset.quantity > 0)
  }

  continuingAttachedValue = continuingAttachedValue.concat(continuingVaultFT)

  const wallet = await getWallet()
  const protocolParameters = await getProtocolParameters()

  // Fee buffer
  protocolParameters.linearFee.minFeeB = (
    parseInt(protocolParameters.linearFee.minFeeB) + 150
  ).toString()

  const txBuilder = await getTXBuilder(protocolParameters)

  const walletAddress = BaseAddress.from_address(
    Address.from_hex(await getWalletAddress()),
  )

  txBuilder.add_required_signer(
    Ed25519KeyHash.from_bytes(
      walletAddress?.payment_cred()?.to_keyhash()?.to_bytes() ?? fromHex(""),
    ),
  )

  const scriptAddr = Address.from_bech32(STAKING_ADDR)

  const contractUtxo = TransactionUnspentOutput.new(
    TransactionInput.new(
      TransactionHash.from_bytes(fromHex(txHash)),
      Number(outputIdx),
    ),
    TransactionOutput.new(scriptAddr, assetsToValue(valuesAttached)),
  )

  const scriptHash = ScriptHash.from_hex(STAKING_SCRIPT_HASH)
  const refInput = TransactionInput.new(
    TransactionHash.from_hex(STAKING_REF_TRANSACTION_HASH),
    STAKING_REF_INDEX,
  )
  const scriptSource = PlutusScriptSource.new_ref_input(
    scriptHash,
    refInput,
    Language.new_plutus_v2(),
    STAKING_REF_SCRIPT_SIZE,
  )

  // Add some funds from the user to cover the network fee
  if (!withdrawingAll) {
    const outputAssets = [{ unit: "lovelace", quantity: 1e6 }]
    const temp_output = TransactionOutput.new(
      walletAddress?.to_address() ?? Address.from_bech32(
        "addr1q88s0l80wtgq2kz2ljqyrkp22qhrxrjghvgj42rmm7yzs408un8nly8jpm7wnz0qprpz0ejn7e53cmr4mnz3pf3xn8as96vv2w",
      ),
      assetsToValue(outputAssets),
    )

    const outputs = TransactionOutputs.new()
    outputs.add(temp_output)

    const utxos = (await wallet.getUtxos()).map((utxo: string) =>
      TransactionUnspentOutput.from_bytes(fromHex(utxo)),
    )

    CoinSelection.setProtocolParameters(
      protocolParameters.minUtxo,
      protocolParameters.linearFee.minFeeA,
      protocolParameters.linearFee.minFeeB,
      protocolParameters.maxTxSize.toString(),
      protocolParameters.coinsPerUtxoByte.toString(),
    )

    const { input } = CoinSelection.randomImprove(utxos, outputs, 14, undefined)

    input.forEach((utxo: TransactionUnspentOutput) => {
      txBuilder.add_regular_input(
        utxo.output().address(),
        utxo.input(),
        utxo.output().amount(),
      )
      tx_inputs.push(utxo.input().to_hex())
    })
  }

  // We burn all unspent delegation NFTs
  const mintBuilder = MintBuilder.new()

  const mintRedeemer = buildDummyBurnRedeemer()

  const mintScriptHash = ScriptHash.from_hex(VOTE_PERMISSION_NFT_SCRIPT_HASH)
  const mintRefInput = TransactionInput.new(
    TransactionHash.from_hex(VOTE_PERMISSION_NFT_REF_TRANSACTION_HASH),
    VOTE_PERMISSION_NFT_REF_INDEX,
  )

  const mintWitness = MintWitness.new_plutus_script(
    PlutusScriptSource.new_ref_input(
      mintScriptHash,
      mintRefInput,
      Language.new_plutus_v2(),
      VOTE_PERMISSION_NFT_REF_SCRIPT_SIZE,
    ),
    mintRedeemer,
  )

  for (let i = 0; i < valuesAttached.length; i += 1) {
    if (
      valuesAttached[i].unit.slice(0, 56) === VOTE_PERMISSION_NFT_SCRIPT_HASH
    ) {
      mintBuilder.add_asset(
        mintWitness,
        AssetName.new(fromHex(valuesAttached[i].unit.slice(56))),
        Int.from_str((-1 * valuesAttached[i].quantity).toString()),
      )
    }
  }

  tx_inputs.push(contractUtxo.input().to_hex())

  tx_inputs.sort()

  const contractUtxoIdx = tx_inputs.findIndex(
    (input) => input === contractUtxo.input().to_hex(),
  )

  const redeemer = buildWithdrawRedeemer(contractUtxoIdx.toString(), "0")

  const datumSource = DatumSource.new_ref_input(contractUtxo.input())
  const plutusWitness = PlutusWitness.new_with_ref(
    scriptSource,
    datumSource,
    redeemer,
  )

  txBuilder.add_plutus_script_input(
    plutusWitness,
    contractUtxo.input(),
    contractUtxo.output().amount(),
  )

  // If no continuing stake, also burn Vote NFTs
  if (withdrawingAll) {
    const voteNftBurnRedeemer = buildBurnVoteNFTRedeemer()
    const voteNftScriptHash = ScriptHash.from_hex(STAKING_VOTE_NFT_POLICY_ID)
    const voteNftRefInput = TransactionInput.new(
      TransactionHash.from_hex(STAKING_VOTE_NFT_REF_TRANSACTION_HASH),
      STAKING_VOTE_NFT_REF_INDEX,
    )
    const voteNftMintWitness = MintWitness.new_plutus_script(
      PlutusScriptSource.new_ref_input(
        voteNftScriptHash,
        voteNftRefInput,
        Language.new_plutus_v2(),
        STAKING_VOTE_NFT_REF_SCRIPT_SIZE,
      ),
      voteNftBurnRedeemer,
    )
    // const mintWitness = MintWitness.new_plutus_script(
    //   PlutusScriptSource.new(PlutusScript.new_v2(fromHex(voteNFTMintScript))),
    //   mintRedeemer,
    // )

    for (let i = 0; i < valuesAttached.length; i += 1) {
      if (valuesAttached[i].unit.slice(0, 56) === STAKING_VOTE_NFT_POLICY_ID) {
        mintBuilder.add_asset(
          voteNftMintWitness,
          AssetName.new(fromHex(valuesAttached[i].unit.slice(56))),
          Int.from_str((-1 * valuesAttached[i].quantity).toString()),
        )
      }
    }
  }

  txBuilder.set_mint_builder(mintBuilder)

  // compute costmdl
  const costmdls = Costmdls.from_json(
    JSON.stringify(protocolParameters.costModels),
  )
  txBuilder.calc_script_data_hash(costmdls)

  if (!withdrawingAll) {
    const output = createOutputInlineDatum(
      scriptAddr,
      assetsToValue(continuingAttachedValue),
      buildStakingState(walletAddress, participations), // TODO can also used the passed datum here if this causes errors
    )

    txBuilder.add_output(output)
  }

  const collateralInputs = await buildCollateralInputs(
    wallet,
    "Cancel Request Error",
  )
  txBuilder.set_collateral(collateralInputs)

  const minFee = txBuilder.min_fee()

  console.log("Min Fee", minFee.to_str())

  const buffer = BigNum.from_str("10000")
  const bufferedFee = minFee.checked_add(buffer)
  txBuilder.set_fee(bufferedFee)

  txBuilder.add_change_if_needed(
    walletAddress?.to_address() ??
      Address.from_bech32(
        "addr1q88s0l80wtgq2kz2ljqyrkp22qhrxrjghvgj42rmm7yzs408un8nly8jpm7wnz0qprpz0ejn7e53cmr4mnz3pf3xn8as96vv2w",
      ),
  )

  const unixTimestamp = Math.floor(Date.now())
  const slot = unixTimeToSlot(unixTimestamp) - 40
  txBuilder.set_validity_start_interval_bignum(BigNum.from_str(slot.toString()))

  const unsignedTransaction = txBuilder.build_tx()

  let txVkeyWitnesses, signError
  try {
    txVkeyWitnesses = await wallet.signTx(unsignedTransaction.to_hex(), true)
  } catch (error) {
    signError = error
  }

  if (!txVkeyWitnesses || signError) {
    toast({
      title: "Cancel Request Error",
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

  console.log(signedTx.to_hex())

  try {
    const txHash = await wallet.submitTx(signedTx.to_hex())
    console.log("Staking Cancel TxHash", txHash)
    toast({
      title: "Cancel Request",
      description: "Cancel submitted successfully.",
      status: "success",
      duration: 5000,
      isClosable: true,
    })
    return txHash
  } catch (error) {
    console.error("Staking Cancel Error", error)
    toast({
      title: "Cancel Request Error",
      description: `Error received:\n${error}`,
      status: "error",
      duration: 5000,
      isClosable: true,
    })
    return Promise.reject(`An error occurred: \n${error}`)
  }
}
