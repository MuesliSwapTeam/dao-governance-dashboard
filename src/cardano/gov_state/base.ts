import { getWallet, getWalletAddress } from "../wallet.ts"
import {
  fromHex,
  getTXBuilder,
  getProtocolParameters,
  assetsToValue,
  createOutputInlineDatum,
  unixTimeToSlot,
  selectInputUtxos,
} from "../utils/utils.ts"

import { FundPayoutArgs, Vote } from "../../api/model/tally"

import {
  BaseAddress,
  Address,
  TransactionUnspentOutput,
  TransactionInput,
  TransactionHash,
  TransactionOutput,
  PlutusScriptSource,
  DatumSource,
  PlutusWitness,
  Redeemer,
  RedeemerTag,
  BigNum,
  ExUnits,
  Costmdls,
  TxInputsBuilder,
  PlutusData,
  MintWitness,
  Language,
  ScriptHash,
  MintBuilder,
  AssetName,
  Int,
  TransactionWitnessSet,
  Transaction,
  AuxiliaryData,
  GeneralTransactionMetadata,
  encode_json_str_to_metadatum,
} from "@emurgo/cardano-serialization-lib-browser"

import {
  GOV_STATE_ADDR,
  GOV_STATE_NFT_POLICY_ID,
  GOV_STATE_NFT_TOKEN_NAME_HEX,
  GOV_STATE_SCRIPT_HASH,
  GOV_TOKEN_NAME_HEX,
  GOV_TOKEN_POLICY_ID,
  STAKING_SCRIPT_HASH,
  STAKING_VOTE_NFT_POLICY_ID,
  TALLY_AUTH_NFT_NAME_HEX,
  TALLY_AUTH_NFT_POLICY_ID,
  TALLY_AUTH_NFT_REF_INDEX,
  TALLY_AUTH_NFT_SCRIPT_HASH,
  TALLY_AUTH_NFT_REF_TRANSACTION_HASH,
  VAULT_FT_TOKEN_POLICY_ID,
  GOV_STATE_REF_TRNSACTION_HASH,
  GOV_STATE_REF_INDEX,
  TALLY_ADDR,
  TALLY_SCRIPT_HASH,
} from "../config.ts"

import { AuthRedeemer, CreateNewTally } from "../types/redeemer.ts"
import { toast } from "../../components/ToastContainer.ts"
import {
  FundPayoutParams,
  GovStateDatum,
  GovStateParams,
  ProposalList,
  ProposalParams,
  TallyState,
  ZeroVoteList,
  OpinionDatum,
} from "../types/data.ts"
import {
  AddressBaseType,
  ExtendedPosixTimeBaseType,
  FractionBaseType,
  Nothing,
  TokenBaseType,
  TxOut,
} from "../types/basic.ts"

function buildCreateNewTallyRedeemer(
  govStateInputIndex: string,
  govStateOutputIndex: string,
  tallyOutputindex: string,
) {
  const redeemerData = CreateNewTally(
    govStateInputIndex,
    govStateOutputIndex,
    tallyOutputindex,
  )

  const redeemer = Redeemer.new(
    RedeemerTag.new_spend(),
    BigNum.from_str("0"),
    redeemerData,
    ExUnits.new(BigNum.from_str("1500000"), BigNum.from_str("1200000000")),
  )

  return redeemer
}

function buildGovState(
  minQuorum: string,
  minWinningThresholdNumerator: string,
  minWinningThresholDenominator: string,
  minProposalDuration: string,
  latestAppliedProposalId: string,
  lastProposalId: string,
) {
  const tallyAddress: AddressBaseType = {
    isScript: true,
    pubKeyHash: TALLY_SCRIPT_HASH,
    stakeKeyHash: undefined,
  }

  const stakingAddress: AddressBaseType = {
    isScript: true,
    pubKeyHash: STAKING_SCRIPT_HASH,
    stakeKeyHash: undefined,
  }

  const governanceToken: TokenBaseType = {
    tokenPolicyId: GOV_TOKEN_POLICY_ID,
    tokenNameHex: GOV_TOKEN_NAME_HEX,
  }

  const minWinningThreshold: FractionBaseType = {
    numerator: minWinningThresholdNumerator,
    denominator: minWinningThresholDenominator,
  }

  const govStateNft: TokenBaseType = {
    tokenPolicyId: GOV_STATE_NFT_POLICY_ID,
    tokenNameHex: GOV_STATE_NFT_TOKEN_NAME_HEX,
  }

  const tallyAuthNftPolicy = TALLY_AUTH_NFT_POLICY_ID
  const stakingVoteNftPolicy = STAKING_VOTE_NFT_POLICY_ID

  const data = GovStateParams(
    tallyAddress,
    stakingAddress,
    governanceToken,
    VAULT_FT_TOKEN_POLICY_ID,
    minQuorum,
    minWinningThreshold,
    minProposalDuration,
    govStateNft,
    tallyAuthNftPolicy,
    stakingVoteNftPolicy,
    latestAppliedProposalId,
  )

  const datum = GovStateDatum(data, lastProposalId)

  return datum
}

// TODO: we need to find a frontend specific format to define proposals
function buildTallyState(
  proposals: PlutusData,
  proposalAmount: number,
  quorum: string,
  winningThresholdNumerator: string,
  winningThresholdDenominaor: string,
  endTime: string,
  proposalId: string,
) {
  const winningThreshold: FractionBaseType = {
    numerator: winningThresholdNumerator,
    denominator: winningThresholdDenominaor,
  }

  const endTimePosix: ExtendedPosixTimeBaseType = {
    negInfBool: false,
    time: endTime,
    posInfBool: false,
  }

  const tallyAuthNft: TokenBaseType = {
    tokenPolicyId: TALLY_AUTH_NFT_POLICY_ID,
    tokenNameHex: TALLY_AUTH_NFT_NAME_HEX,
  }

  const stakingVoteNftPolicy = STAKING_VOTE_NFT_POLICY_ID
  const vaultFtPolicy = VAULT_FT_TOKEN_POLICY_ID

  const stakingAddress: AddressBaseType = {
    isScript: true,
    pubKeyHash: STAKING_SCRIPT_HASH,
    stakeKeyHash: undefined,
  }

  const governanceToken: TokenBaseType = {
    tokenPolicyId: GOV_TOKEN_POLICY_ID,
    tokenNameHex: GOV_TOKEN_NAME_HEX,
  }

  const proposalParams = ProposalParams(
    quorum,
    winningThreshold,
    proposals,
    endTimePosix,
    proposalId,
    tallyAuthNft,
    stakingVoteNftPolicy,
    stakingAddress,
    governanceToken,
    vaultFtPolicy,
  )

  const listData = ZeroVoteList(proposalAmount)

  return TallyState(listData, proposalParams)
}

function buildAuthRedeemer(spent_utxo_index: string) {
  const governanceNftName: TokenBaseType = {
    tokenPolicyId: GOV_STATE_NFT_POLICY_ID,
    tokenNameHex: GOV_STATE_NFT_TOKEN_NAME_HEX,
  }

  const redeemerData = AuthRedeemer(spent_utxo_index, governanceNftName)

  const redeemer = Redeemer.new(
    RedeemerTag.new_mint(),
    BigNum.from_str("0"),
    redeemerData,
    ExUnits.new(BigNum.from_str("250000"), BigNum.from_str("100000000")),
  )

  return redeemer
}

function buildProposalList(proposals: Vote[]) {
  const proposalList: PlutusData[] = []

  // go through each proposal and built correct data type
  for (let i = 0; i < proposals.length; i++) {
    const proposal = proposals[i]

    if (proposal.type === "Reject") proposalList.push(Nothing())
    if (proposal.type === "Opinion")
      proposalList.push(OpinionDatum(proposal.title))

    if (proposal.type === "FundPayout") {
      const address = Address.from_bech32(
        (proposal.args as FundPayoutArgs).address,
      )
      const pubKeyHash = BaseAddress.from_address(address)
        ?.payment_cred()
        .to_keyhash()
        ?.to_hex()

      const stakeKeyHash = BaseAddress.from_address(address)
        ?.stake_cred()
        .to_keyhash()
        ?.to_hex()

      const treasuryBenefactor: AddressBaseType = {
        isScript: false,
        pubKeyHash: pubKeyHash ?? "",
        stakeKeyHash: stakeKeyHash,
      }

      const outputTx = TxOut(
        treasuryBenefactor,
        assetsToValue((proposal.args as FundPayoutArgs).assets),
      )
      proposalList.push(FundPayoutParams(outputTx))
    }
  }

  /*const outputTx = TxOut(treasuryBenefactor, assetsToValue(value))
  const treasuryPayout = FundPayoutParams(outputTx)

  proposalList.push(treasuryPayout)
  
  const licenseRelease = LicenseReleaseParams(treasuryBenefactor, "1000000000");
  proposalList.push(licenseRelease);*/

  //const textBytes = PlutusData.new_bytes(Buffer.from("Hello this is Christoffer!", 'utf8'));
  //proposalList.push(textBytes);

  return ProposalList(proposalList)
}

function createAuxiliaryData(metadataProposals: string) {
  const auxData = AuxiliaryData.new()
  const generalMetadata = GeneralTransactionMetadata.new()
  generalMetadata.insert(
    BigNum.from_str("674"),
    encode_json_str_to_metadatum(
      JSON.stringify(["MuesliSwap DAO Tally Creation"]),
      1,
    ),
  )
  generalMetadata.insert(
    BigNum.from_str("2000"),
    encode_json_str_to_metadatum(metadataProposals, 1),
  )

  auxData.set_metadata(generalMetadata)
  return auxData
}

async function createTally(
  govStateTxHash: string,
  govStateIndex: number,
  govStateValuesAttached: { unit: string; quantity: number }[],
  minQuorum: string,
  minWinningThreshold: string,
  minProposalDuration: string,
  latestAppliedProposalId: string,
  latestProposalId: string,
  endTime: string,
  metadataProposals: string,
  proposals: Vote[],
) {
  const wallet = await getWallet()
  const protocolParameters = await getProtocolParameters()

  const txBuilder = await getTXBuilder(protocolParameters)

  const walletAddress = BaseAddress.from_address(
    Address.from_hex(await getWalletAddress()),
  )

  // we need to already perform the input utxo selection to determine the index of the scriptUtxo in the redeemer (as input utxos are lexiographically ordered in transactions)
  const utxos = await selectInputUtxos(wallet, 8e6)
  if (!utxos) return

  for (let i = 0; i < utxos.len(); i++) {
    const utxo = utxos.get(i)
    txBuilder.add_regular_input(
      utxo.output().address(),
      utxo.input(),
      utxo.output().amount(),
    )
  }

  const govStateScriptAddr = Address.from_bech32(GOV_STATE_ADDR)
  const govStateUtxo = TransactionUnspentOutput.new(
    TransactionInput.new(
      TransactionHash.from_bytes(fromHex(govStateTxHash)),
      Number(govStateIndex),
    ),
    TransactionOutput.new(
      govStateScriptAddr,
      assetsToValue(govStateValuesAttached),
    ),
  )

  let allUtxosArray: { txHash: string; index: number }[] = []
  for (let i = 0; i < utxos.len(); i++) {
    const utxo = utxos.get(i)
    allUtxosArray.push({
      txHash: utxo.input().transaction_id().to_hex(),
      index: utxo.input().index(),
    })
  }
  allUtxosArray = allUtxosArray
    .concat([{ txHash: govStateTxHash, index: Number(govStateIndex) }])
    .sort((a, b) => {
      const txIdComparison = a.txHash.localeCompare(b.txHash)
      if (txIdComparison === 0) {
        return a.index - b.index
      }
      return txIdComparison
    })

  const scriptUtxoIndex: number = allUtxosArray.findIndex(
    (utxo) => utxo.txHash === govStateTxHash && utxo.index == govStateIndex,
  )

  const govScriptSource = PlutusScriptSource.new_ref_input(
    ScriptHash.from_hex(GOV_STATE_SCRIPT_HASH),
    TransactionInput.new(
      TransactionHash.from_bytes(fromHex(GOV_STATE_REF_TRNSACTION_HASH)),
      GOV_STATE_REF_INDEX,
    ),
    Language.new_plutus_v2(),
    7691,
  )

  const redeemer = buildCreateNewTallyRedeemer(
    scriptUtxoIndex.toString(),
    "0",
    "1",
  )

  const datumSource = DatumSource.new_ref_input(govStateUtxo.input())
  const plutusWitness = PlutusWitness.new_with_ref(
    govScriptSource,
    datumSource,
    redeemer,
  )

  txBuilder.add_plutus_script_input(
    plutusWitness,
    govStateUtxo.input(),
    govStateUtxo.output().amount(),
  )

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

  const minWinningThresholdSplit = minWinningThreshold.split("/")
  const minWinningThresholdNumerator = minWinningThresholdSplit[0]
  const minWinningThresholdDenominaor = minWinningThresholdSplit[1]

  const govStateOutput = createOutputInlineDatum(
    govStateScriptAddr,
    assetsToValue(govStateValuesAttached),
    buildGovState(
      minQuorum,
      minWinningThresholdNumerator,
      minWinningThresholdDenominaor,
      minProposalDuration,
      latestAppliedProposalId,
      (Number(latestProposalId) + 1).toString(),
    ),
  )

  txBuilder.add_output(govStateOutput)

  const mintRedeemer = buildAuthRedeemer(scriptUtxoIndex.toString())
  const mintScriptReference = PlutusScriptSource.new_ref_input(
    ScriptHash.from_hex(TALLY_AUTH_NFT_SCRIPT_HASH),
    TransactionInput.new(
      TransactionHash.from_bytes(fromHex(TALLY_AUTH_NFT_REF_TRANSACTION_HASH)),
      TALLY_AUTH_NFT_REF_INDEX,
    ),
    Language.new_plutus_v2(),
    913,
  )

  const mintWitness = MintWitness.new_plutus_script(
    mintScriptReference,
    mintRedeemer,
  )

  const mintBuilder = MintBuilder.new()
  mintBuilder.add_asset(
    mintWitness,
    AssetName.new(fromHex(TALLY_AUTH_NFT_NAME_HEX)),
    Int.from_str("1"),
  )

  txBuilder.set_mint_builder(mintBuilder)

  const tallyAddress = Address.from_bech32(TALLY_ADDR)
  const value = [
    { unit: "lovelace", quantity: 3e6 },
    { unit: TALLY_AUTH_NFT_POLICY_ID + TALLY_AUTH_NFT_NAME_HEX, quantity: 1 },
  ]

  const proposalData = buildProposalList(proposals)

  const tallyOutput = createOutputInlineDatum(
    tallyAddress,
    assetsToValue(value),
    buildTallyState(
      proposalData,
      proposals.length,
      minQuorum,
      minWinningThresholdNumerator,
      minWinningThresholdDenominaor,
      endTime,
      (Number(latestProposalId) + 1).toString(),
    ),
  )

  txBuilder.add_output(tallyOutput)

  txBuilder.add_inputs_from(utxos, 2)

  const costmdls = Costmdls.from_json(
    JSON.stringify(protocolParameters.costModels),
  )

  txBuilder.calc_script_data_hash(costmdls)

  const currentTime = Date.now() + 120 * 1000
  const slot = unixTimeToSlot(currentTime)
  txBuilder.set_ttl_bignum(BigNum.from_str(slot.toString()))

  const auxData = createAuxiliaryData(metadataProposals)
  txBuilder.set_auxiliary_data(auxData)

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
    console.log("Tally Creation TxHash", txHash)
    toast({
      title: "Tally Created",
      description: "Tally Creation submitted successfully.",
      status: "success",
      duration: 5000,
      isClosable: true,
    })
    return txHash
  } catch (error) {
    console.error("Tally Creation Error:", error)
    toast({
      title: "Tally Create Error",
      description: `Error received:\n${error}`,
      status: "error",
      duration: 5000,
      isClosable: true,
    })
    return Promise.reject(`An error occurred: \n${error}`)
  }
}

export { createTally }
