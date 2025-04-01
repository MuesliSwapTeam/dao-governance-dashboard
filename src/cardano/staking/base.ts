import {
  TransactionOutputs,
  BaseAddress,
  Address,
  TransactionUnspentOutput,
  Ed25519KeyHash,
  TransactionInput,
  TransactionHash,
  TransactionOutput,
  PlutusScript,
  PlutusScriptSource,
  DatumSource,
  PlutusWitness,
  Costmdls,
  RedeemerTag,
  BigNum,
  ExUnits,
  Redeemer,
  TxInputsBuilder,
  TransactionWitnessSet,
  Transaction,
  PlutusList,
  PlutusData,
  MintBuilder,
  MintWitness,
  AssetName,
  Int,
} from "@emurgo/cardano-serialization-lib-browser"
import {
  GOV_TOKEN_POLICY_ID,
  GOV_TOKEN_NAME_HEX,
  VAULT_FT_TOKEN_POLICY_ID,
  TALLY_AUTH_NFT_POLICY_ID,
  TALLY_AUTH_NFT_NAME_HEX,
  STAKING_ADDR,
  STAKING_VOTE_NFT_POLICY_ID,
  VOTE_PERMISSION_NFT_SCRIPT_HASH,
} from "../config.ts"
import { contract } from "./stakingScript"
import {
  fromHex,
  getTXBuilder,
  getProtocolParameters,
  assetsToValue,
  createOutputInlineDatum,
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
import { WithdrawFunds } from "../types/redeemer.ts"
import { signSubmitTx } from "../utils/utils.ts"
import { toast } from "../../components/ToastContainer.ts"
import { Participation as ParticipationInterface } from "../../api/model/staking.ts"
import { contract as mintScript } from "../tally/mintScript"

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
    ExUnits.new(BigNum.from_str("650000"), BigNum.from_str("300000000")),
  )

  return redeemer
}

function buildDummyBurnRedeemer() {
  const redeemerData = EmptyList()

  const redeemer = Redeemer.new(
    RedeemerTag.new_mint(),
    BigNum.from_str("0"),
    redeemerData,
    ExUnits.new(BigNum.from_str("10000"), BigNum.from_str("10000000")),
  )

  return redeemer
}

export async function lockTokens(
  governanceTokenAmount: number,
  vaultFTNameHex: string,
  vaultFTTokenAmount: number,
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

  if (vaultFTTokenAmount > 0)
    assets.push({
      unit: VAULT_FT_TOKEN_POLICY_ID + vaultFTNameHex,
      quantity: vaultFTTokenAmount,
    })

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

export async function unlockTokens(
  txHash: string,
  outputIdx: string,
  valuesAttached: { unit: string; quantity: number }[],
  participations: ParticipationInterface[],
) {
  /*
  console.log('valuesAttached', valuesAttached)

  valuesAttached = [
    {unit : 'lovelace', quantity: 5728030},
    {unit : 'bd976e131cfc3956b806967b06530e48c20ed5498b46a5eb836b61c2744d494c4b7632', quantity: 20000000}
  ]
    */

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

  const scriptAddr = Address.from_bech32(STAKING_ADDR)

  const contractUtxo = TransactionUnspentOutput.new(
    TransactionInput.new(
      TransactionHash.from_bytes(fromHex(txHash)),
      Number(outputIdx),
    ),
    TransactionOutput.new(scriptAddr, assetsToValue(valuesAttached)),
  )

  const script = PlutusScript.new_v2(fromHex(contract))
  const scriptSource = PlutusScriptSource.new(script)

  // we simply assume we are not adding any additional inputs - as the ADA locked will be able to pay for the script execution
  const redeemer = buildWithdrawRedeemer("0", "0")

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

  // We burn all unspent delegation NFTs
  const mintBuilder = MintBuilder.new()

  const mintRedeemer = buildDummyBurnRedeemer()

  const mintWitness = MintWitness.new_plutus_script(
    PlutusScriptSource.new(PlutusScript.new_v2(fromHex(mintScript))),
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

  txBuilder.set_mint_builder(mintBuilder)

  // compute costmdl
  const costmdls = Costmdls.from_json(
    JSON.stringify(protocolParameters.costModels),
  )
  txBuilder.calc_script_data_hash(costmdls)

  // TODO: adjust collateral function based on wallet! (this really needs to be fixed)
  const walletCollateral = await wallet.experimental.getCollateral()
  const collateralUtxo = walletCollateral
    ?.map((utxo: string) => TransactionUnspentOutput.from_bytes(fromHex(utxo)))
    ?.at(0)

  if (!collateralUtxo) {
    toast({
      title: "Cancel Request Error",
      description: `Collateral not found. Please set your collateral to continue`,
      status: "error",
      duration: 5000,
      isClosable: true,
    })
    return Promise.reject(`An error occurred: \nCollateral not set`)
  }

  const txInputsBuilder = TxInputsBuilder.new()
  txInputsBuilder.add_regular_input(
    collateralUtxo.output().address(),
    collateralUtxo.input(),
    collateralUtxo.output().amount(),
  )

  txBuilder.set_collateral(txInputsBuilder)

  // add necessary outputs
  const outputAssets = [{ unit: "lovelace", quantity: 1e6 }]

  const output = createOutputInlineDatum(
    scriptAddr,
    assetsToValue(outputAssets),
    buildStakingState(walletAddress, participations),
  )

  txBuilder.add_output(output)

  txBuilder.add_change_if_needed(
    walletAddress?.to_address() ??
      Address.from_bech32(
        "addr1q88s0l80wtgq2kz2ljqyrkp22qhrxrjghvgj42rmm7yzs408un8nly8jpm7wnz0qprpz0ejn7e53cmr4mnz3pf3xn8as96vv2w",
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
