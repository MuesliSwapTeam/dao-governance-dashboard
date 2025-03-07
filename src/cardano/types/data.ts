import {
  BigNum,
  ConstrPlutusData,
  PlutusData,
  PlutusList,
  BigInt,
} from "@emurgo/cardano-serialization-lib-browser"
import {
  Address,
  AddressBaseType,
  ExtendedPosixTime,
  ExtendedPosixTimeBaseType,
  Fraction,
  FractionBaseType,
  Integer,
  NoOutputDatum,
  PolicyId,
  PosixTime,
  Token,
  TokenBaseType,
} from "./basic"
import { Buffer } from "buffer"

export function ProposalId(proposalId: string) {
  return Integer(proposalId)
}

export function ProposalParams(
  quorum: string,
  winningThreshold: FractionBaseType,
  proposals: PlutusData,
  endTime: ExtendedPosixTimeBaseType,
  proposalId: string,
  tallyAuthNft: TokenBaseType,
  stakingVoteNftPolicy: string,
  stakingAddress: AddressBaseType,
  governanceToken: TokenBaseType,
  vaultFtPolicy: string,
) {
  // TODO: this needs to be fixed and understood better - what kind of list to add here? what constr to use?
  const plutusList = PlutusList.new()

  plutusList.add(Integer(quorum))
  plutusList.add(Fraction(winningThreshold))

  plutusList.add(proposals)

  plutusList.add(ExtendedPosixTime(endTime))
  plutusList.add(ProposalId(proposalId))
  plutusList.add(Token(tallyAuthNft))
  plutusList.add(PolicyId(stakingVoteNftPolicy))
  plutusList.add(Address(stakingAddress))
  plutusList.add(Token(governanceToken))
  plutusList.add(PolicyId(vaultFtPolicy))

  const plutusData = PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("0"), plutusList),
  )

  return plutusData
}

export function ReducedProposalParams(
  endTime: ExtendedPosixTimeBaseType,
  proposalId: string,
  tallyAuthNft: TokenBaseType,
  stakingVoteNftPolicy: string,
  governanceToken: TokenBaseType,
  vaultFtPolicy: string,
) {
  const plutusList = PlutusList.new()

  plutusList.add(ExtendedPosixTime(endTime))
  plutusList.add(ProposalId(proposalId))
  plutusList.add(Token(tallyAuthNft))
  plutusList.add(PolicyId(stakingVoteNftPolicy))
  plutusList.add(Token(governanceToken))
  plutusList.add(PolicyId(vaultFtPolicy))

  const plutusData = PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("0"), plutusList),
  )

  return plutusData
}

export function Participation(
  tallyParams: any,
  weight: string,
  proposalIndex: string,
) {
  const plutusList = PlutusList.new()
  plutusList.add(tallyParams)
  plutusList.add(Integer(weight))
  plutusList.add(Integer(proposalIndex))

  const plutusData = PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("0"), plutusList),
  )

  return plutusData
}

/* STAKING CONTRACT DATUMS */

export function StakingParams(
  owner: AddressBaseType,
  governanceToken: TokenBaseType,
  vaultFtPolicy: string,
  tallyAuthNft: TokenBaseType,
) {
  const plutusList = PlutusList.new()
  plutusList.add(Address(owner))
  plutusList.add(Token(governanceToken))
  plutusList.add(PolicyId(vaultFtPolicy))
  plutusList.add(Token(tallyAuthNft))

  const plutusData = PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("0"), plutusList),
  )

  return plutusData
}

export function StakingState(
  participationList: PlutusData,
  stakingParams: PlutusData,
) {
  const plutusList = PlutusList.new()

  plutusList.add(participationList)
  plutusList.add(stakingParams)

  const plutusData = PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("0"), plutusList),
  )

  return plutusData
}

/* GOV STATE DATUMS */

export function GovStateParams(
  tallyAddress: AddressBaseType,
  stakingAddress: AddressBaseType,
  governanceToken: TokenBaseType,
  vaultFtPolicy: string,
  minQuorum: string,
  minWinningThreshold: FractionBaseType,
  minProposalDuration: string,
  govStateNft: TokenBaseType,
  tallyAuthNftPolicy: string,
  stakingVoteNftPolicy: string,
  latestAppliedProposalId: string,
) {
  const plutusList = PlutusList.new()

  plutusList.add(Address(tallyAddress))
  plutusList.add(Address(stakingAddress))
  plutusList.add(Token(governanceToken))
  plutusList.add(PolicyId(vaultFtPolicy))
  plutusList.add(Integer(minQuorum))
  plutusList.add(Fraction(minWinningThreshold))
  plutusList.add(PosixTime(minProposalDuration))
  plutusList.add(Token(govStateNft))
  plutusList.add(PolicyId(tallyAuthNftPolicy))
  plutusList.add(PolicyId(stakingVoteNftPolicy))
  plutusList.add(Integer(latestAppliedProposalId))

  const plutusData = PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("0"), plutusList),
  )

  return plutusData
}

export function GovStateUpdateParams(
  govStateParams: any,
  address: AddressBaseType,
) {
  const plutusList = PlutusList.new()
  plutusList.add(govStateParams)
  plutusList.add(Address(address))

  const plutusData = PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("100"), plutusList),
  )

  return plutusData
}

export function GovStateDatum(govStateParams: any, latestProposalId: string) {
  const plutusList = PlutusList.new()
  plutusList.add(govStateParams)
  plutusList.add(Integer(latestProposalId))

  const plutusData = PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("0"), plutusList),
  )

  return plutusData
}

/* TALLY DATUMS AND DIFFERENT OUTCOMES */

export function TallyState(votes: any, proposalParams: any) {
  const plutusList = PlutusList.new()
  plutusList.add(votes)
  plutusList.add(proposalParams)

  const plutusData = PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("0"), plutusList),
  )

  return plutusData
}

// TODO: the type of outputTx should be TxOut which we first need to properly define
export function FundPayoutParams(outputTx: PlutusData) {
  const plutusList = PlutusList.new()
  plutusList.add(outputTx)

  const plutusData = PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("102"), plutusList),
  )

  return plutusData
}

export function DelegatedAddVote(particpation: PlutusData) {
  const plutusList = PlutusList.new()
  plutusList.add(particpation)

  return PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("1"), plutusList),
  )
}

export function DelegatedRetractVote(particpation: PlutusData) {
  const plutusList = PlutusList.new()
  plutusList.add(particpation)

  return PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("2"), plutusList),
  )
}

export function VotePermissionNFTParams(
  owner: AddressBaseType,
  redeemer: PlutusData,
) {
  const plutusList = PlutusList.new()
  plutusList.add(Address(owner))
  plutusList.add(redeemer)

  const constrPlutusData = PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("1"), plutusList),
  )

  return constrPlutusData
}

// TODO: add other datatypes including license issuing, pool upgrades etc.

/* OWN DATA TYPES TO MAKE HANDLING EASIER */
export function ProposalList(list: PlutusData[]) {
  const plutusList = PlutusList.new()
  for (const item of list) {
    plutusList.add(item)
  }

  return PlutusData.new_list(plutusList)
}

export function ZeroVoteList(number: number) {
  const plutusList = PlutusList.new()
  for (let i = 0; i < number; i++) {
    plutusList.add(PlutusData.new_integer(BigInt.from_str("0")))
  }

  return PlutusData.new_list(plutusList)
}

export function LicenseReleaseParams(
  address: AddressBaseType,
  maximumFutureValidity: string,
) {
  const plutusList = PlutusList.new()
  plutusList.add(Address(address))
  plutusList.add(NoOutputDatum())
  plutusList.add(PosixTime(maximumFutureValidity))

  return PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("101"), plutusList),
  )
}

export function OpinionDatum(title: string) {
  return PlutusData.new_bytes(Buffer.from(title, "utf8"))
}
