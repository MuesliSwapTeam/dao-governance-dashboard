import {
  Address,
  AssetName,
  BaseAddress,
  BigNum,
  Costmdls,
  DatumSource,
  ExUnits,
  Int,
  MintBuilder,
  MintWitness,
  PlutusScriptSource,
  PlutusWitness,
  Redeemer,
  RedeemerTag,
  Transaction,
  TransactionHash,
  TransactionInput,
  TransactionOutput,
  TransactionUnspentOutput,
  TransactionWitnessSet,
  Ed25519KeyHash,
  ScriptHash,
  Language,
} from "@emurgo/cardano-serialization-lib-browser"
import { blake2b } from "blakejs"

import {
  assetsToValue,
  createOutputInlineDatum,
  fromHex,
  getProtocolParameters,
  getTXBuilder,
  selectInputUtxos,
  toHex,
  unixTimeToSlot,
  buildCollateralInputs,
} from "../utils/utils"
import { getWallet, getWalletAddress } from "../wallet"
import {
  GOV_TOKEN_NAME_HEX,
  GOV_TOKEN_POLICY_ID,
  STAKING_ADDR,
  STAKING_REF_INDEX,
  STAKING_REF_TRANSACTION_HASH,
  STAKING_SCRIPT_HASH,
  STAKING_REF_SCRIPT_SIZE,
  STAKING_VOTE_NFT_POLICY_ID,
  TALLY_AUTH_NFT_NAME_HEX,
  TALLY_AUTH_NFT_POLICY_ID,
  VAULT_FT_TOKEN_POLICY_ID,
  VOTE_PERMISSION_NFT_SCRIPT_HASH,
  VOTE_PERMISSION_NFT_REF_SCRIPT_SIZE,
  VOTE_PERMISSION_NFT_REF_TRANSACTION_HASH,
  VOTE_PERMISSION_NFT_REF_INDEX,
} from "../config"
import { AddFunds } from "../types/redeemer"
import {
  DelegatedRetractVote,
  Participation,
  ReducedProposalParams,
  VotePermissionNFTParams,
} from "../types/data"
import {
  AddressBaseType,
  ExtendedPosixTimeBaseType,
  TokenBaseType,
} from "../types/basic"
import { buildStakingState } from "./base"
import { toast } from "../../components/ToastContainer"
import { Participation as ParticipationInterface } from "../../api/model/staking"

function buildAddRedeemer(stateInputIdx: string, stateOutputIdx: string) {
  const redeemerData = AddFunds(stateInputIdx, stateOutputIdx)

  const redeemer = Redeemer.new(
    RedeemerTag.new_spend(),
    BigNum.from_str("0"),
    redeemerData,
    ExUnits.new(BigNum.from_str("2500000"), BigNum.from_str("900000000")),
  )

  return redeemer
}

function buildRevokeVotePermissionRedeemer(
  pubKeyHash: string,
  stakeKeyHash: string | undefined,
  weight: string,
  proposalIndex: string,
  endTimeProposal: string | undefined,
  proposalId: string,
) {
  const ownerAddress: AddressBaseType = {
    isScript: false,
    pubKeyHash: pubKeyHash,
    stakeKeyHash: stakeKeyHash,
  }

  const endTime: ExtendedPosixTimeBaseType = {
    negInfBool: false,
    time: endTimeProposal ?? "",
    posInfBool: endTimeProposal == undefined ? true : false,
  }

  const tallyAuthNFT: TokenBaseType = {
    tokenPolicyId: TALLY_AUTH_NFT_POLICY_ID,
    tokenNameHex: TALLY_AUTH_NFT_NAME_HEX,
  }

  const governanceToken: TokenBaseType = {
    tokenPolicyId: GOV_TOKEN_POLICY_ID,
    tokenNameHex: GOV_TOKEN_NAME_HEX,
  }

  const tallyParams = ReducedProposalParams(
    endTime,
    proposalId,
    tallyAuthNFT,
    STAKING_VOTE_NFT_POLICY_ID,
    governanceToken,
    VAULT_FT_TOKEN_POLICY_ID,
  )

  const participationRedeemer = Participation(
    tallyParams,
    weight,
    proposalIndex,
  )
  const delegateRetractVoteRedeemer = DelegatedRetractVote(
    participationRedeemer,
  )

  const redeemerData = VotePermissionNFTParams(
    ownerAddress,
    delegateRetractVoteRedeemer,
  )

  const redeemer = Redeemer.new(
    RedeemerTag.new_mint(),
    BigNum.from_str("0"),
    redeemerData,
    ExUnits.new(BigNum.from_str("300000"), BigNum.from_str("200000000")),
  )

  return redeemer
}

export async function mintRetractVotePermission(
  stakingTxValuesAttached: { unit: string; quantity: number }[],
  stakingTxHash: string,
  stakingTxOutputIdx: string,
  weight: string,
  proposalId: string,
  proposalEndTime: string,
  proposalVoteIndex: string,
  participations: ParticipationInterface[] | undefined,
) {
  const wallet = await getWallet()
  const protocolParameters = await getProtocolParameters()

  const txBuilder = await getTXBuilder(protocolParameters)

  const walletAddress = BaseAddress.from_address(
    Address.from_hex(await getWalletAddress()),
  )

  const utxos = await selectInputUtxos(wallet, 10e6)
  if (!utxos) return

  for (let i = 0; i < utxos.len(); i++) {
    const utxo = utxos.get(i)

    txBuilder.add_regular_input(
      utxo.output().address(),
      utxo.input(),
      utxo.output().amount(),
    )
  }

  const pubKeyHash = walletAddress?.payment_cred().to_keyhash()?.to_hex() ?? ""
  const stakeKeyHash = walletAddress?.stake_cred().to_keyhash()?.to_hex()

  // STAKING UTXO INPUT
  const stakingAddr = Address.from_bech32(STAKING_ADDR)
  const stakingUtxo = TransactionUnspentOutput.new(
    TransactionInput.new(
      TransactionHash.from_bytes(fromHex(stakingTxHash)),
      Number(stakingTxOutputIdx),
    ),
    TransactionOutput.new(stakingAddr, assetsToValue(stakingTxValuesAttached)),
  )

  txBuilder.add_required_signer(
    Ed25519KeyHash.from_bytes(
      walletAddress?.payment_cred()?.to_keyhash()?.to_bytes() ?? fromHex(""),
    ),
  )

  // const stakingScript = PlutusScript.new_v2(fromHex(contract))
  // const stakingScriptSource = PlutusScriptSource.new(stakingScript)

  const stakingScriptHash = ScriptHash.from_hex(STAKING_SCRIPT_HASH)
  const stakingScriptSource = PlutusScriptSource.new_ref_input(
    stakingScriptHash,
    TransactionInput.new(
      TransactionHash.from_hex(STAKING_REF_TRANSACTION_HASH),
      Number(STAKING_REF_INDEX),
    ),
    Language.new_plutus_v2(),
    STAKING_REF_SCRIPT_SIZE,
  )

  const datumSource = DatumSource.new_ref_input(stakingUtxo.input())

  let allUtxosArray: { txHash: string; index: number }[] = []
  for (let i = 0; i < utxos.len(); i++) {
    const utxo = utxos.get(i)
    allUtxosArray.push({
      txHash: utxo.input().transaction_id().to_hex(),
      index: utxo.input().index(),
    })
  }

  allUtxosArray = allUtxosArray
    .concat([{ txHash: stakingTxHash, index: Number(stakingTxOutputIdx) }])
    .sort((a, b) => {
      const txIdComparison = a.txHash.localeCompare(b.txHash)
      if (txIdComparison === 0) {
        return a.index - b.index
      }
      return txIdComparison
    })

  const scriptUtxoIndex: number = allUtxosArray.findIndex(
    (utxo) =>
      utxo.txHash === stakingTxHash && utxo.index == Number(stakingTxOutputIdx),
  )

  const redeemer = buildAddRedeemer(scriptUtxoIndex.toString(), "0")

  const stakingPlutusWitness = PlutusWitness.new_with_ref(
    stakingScriptSource,
    datumSource,
    redeemer,
  )

  txBuilder.add_plutus_script_input(
    stakingPlutusWitness,
    stakingUtxo.input(),
    stakingUtxo.output().amount(),
  )

  // ADD NFT MINTING
  // const mintScriptReference = PlutusScriptSource.new(
  //   PlutusScript.new_v2(fromHex(mintScript)),
  // )

  // const tallyNftScriptHash = ScriptHash.from_hex(TALLY_AUTH_NFT_SCRIPT_HASH)
  // const tallyNftRefInput = TransactionInput.new(
  //   TransactionHash.from_hex(TALLY_AUTH_NFT_REF_TRANSACTION_HASH),
  //   TALLY_AUTH_NFT_REF_INDEX,
  // )

  const voteNftScriptHash = ScriptHash.from_hex(VOTE_PERMISSION_NFT_SCRIPT_HASH)
  const voteNftRefInput = TransactionInput.new(
    TransactionHash.from_hex(VOTE_PERMISSION_NFT_REF_TRANSACTION_HASH),
    VOTE_PERMISSION_NFT_REF_INDEX,
  )

  const mintScriptReference = PlutusScriptSource.new_ref_input(
    voteNftScriptHash,
    voteNftRefInput,
    Language.new_plutus_v2(),
    VOTE_PERMISSION_NFT_REF_SCRIPT_SIZE,
  )

  const mintRedeemer = buildRevokeVotePermissionRedeemer(
    pubKeyHash,
    stakeKeyHash,
    weight,
    proposalVoteIndex,
    proposalEndTime,
    proposalId,
  )

  const mintWitness = MintWitness.new_plutus_script(
    mintScriptReference,
    mintRedeemer,
  )

  const mintBuilder = MintBuilder.new()

  const mintRedeemerData = mintRedeemer.data().to_bytes()
  const voteNFTName = toHex(blake2b(mintRedeemerData, undefined, 32))

  mintBuilder.add_asset(
    mintWitness,
    AssetName.new(fromHex(voteNFTName)),
    Int.from_str("1"),
  )

  txBuilder.set_mint_builder(mintBuilder)

  // create staking output
  const stakingDatum = buildStakingState(walletAddress, participations)

  let itemIndex = stakingTxValuesAttached.findIndex(
    (x) => x.unit === VOTE_PERMISSION_NFT_SCRIPT_HASH + voteNFTName,
  )

  if (itemIndex === -1) {
    stakingTxValuesAttached = stakingTxValuesAttached.concat([
      {
        unit: VOTE_PERMISSION_NFT_SCRIPT_HASH + voteNFTName,
        quantity: 1,
      },
    ])
  } else {
    stakingTxValuesAttached[itemIndex].quantity += 1
  }

  const stakingScriptOutput = createOutputInlineDatum(
    stakingAddr,
    assetsToValue(stakingTxValuesAttached),
    stakingDatum,
  )

  txBuilder.add_output(stakingScriptOutput)

  const costmdls = Costmdls.from_json(
    JSON.stringify(protocolParameters.costModels),
  )
  txBuilder.calc_script_data_hash(costmdls)

  const currentTime = Date.now() + 240 * 1000
  const slot = unixTimeToSlot(currentTime)
  txBuilder.set_ttl_bignum(BigNum.from_str(slot.toString()))

  const collateralInputs = await buildCollateralInputs(
    wallet,
    "Vote Revoke Error",
  )
  txBuilder.set_collateral(collateralInputs)

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
      title: "Vote Request Error",
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

  console.log("Signed Tx: ", signedTx.to_hex())

  try {
    const txHash = await wallet.submitTx(signedTx.to_hex())
    toast({
      title: "Voting Revoked Succesfully",
      description:
        "Vote successfully revoked. Your revokation will soon be processed.",
      status: "success",
      duration: 5000,
      isClosable: true,
    })
    return txHash
  } catch (error) {
    console.error("Vote Revoked Error", error)
    toast({
      title: "Voting Revoked Error",
      description: `Error received:\n${error}`,
      status: "error",
      duration: 5000,
      isClosable: true,
    })
    return Promise.reject(`An error occurred: \n${error}`)
  }
}
