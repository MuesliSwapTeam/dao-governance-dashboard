import {
  BigNum,
  ConstrPlutusData,
  PlutusData,
  PlutusList,
} from "@emurgo/cardano-serialization-lib-browser"
import { Integer, TokenBaseType, TokenName } from "./basic"

export function AddVote(
  stateInputIdx: string,
  stateOutputIdx: string,
  participation: PlutusData,
) {
  const plutusList = PlutusList.new()

  plutusList.add(Integer(stateInputIdx))
  plutusList.add(Integer(stateOutputIdx))
  plutusList.add(participation)

  const plutusData = PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("1"), plutusList),
  )

  return plutusData
}

export function RetractVote(
  stateInputIdx: string,
  stateOutputIdx: string,
  participationIdx: string,
  tallyInputIndex: string,
) {
  const plutusList = PlutusList.new()

  plutusList.add(Integer(stateInputIdx))
  plutusList.add(Integer(stateOutputIdx))
  plutusList.add(Integer(participationIdx))
  plutusList.add(Integer(tallyInputIndex))

  const plutusData = PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("2"), plutusList),
  )

  return plutusData
}

export function WithdrawFunds(stateInputIdx: string, stateOutputIdx: string) {
  const plutusList = PlutusList.new()
  plutusList.add(Integer(stateInputIdx))
  plutusList.add(Integer(stateOutputIdx))

  const plutusData = PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("3"), plutusList),
  )

  return plutusData
}

export function AddFunds(stateInputIdx: string, stateOutputIdx: string) {
  const plutusList = PlutusList.new()
  plutusList.add(Integer(stateInputIdx))
  plutusList.add(Integer(stateOutputIdx))

  const plutusData = PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("4"), plutusList),
  )

  return plutusData
}

export function FilterOutdatedVotes(
  stateInputIdx: string,
  stateOutputIdx: string,
) {
  const plutusList = PlutusList.new()
  plutusList.add(Integer(stateInputIdx))
  plutusList.add(Integer(stateOutputIdx))

  const plutusData = PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("5"), plutusList),
  )

  return plutusData
}

export function DelegatedAddVote(participation: any) {
  const plutusList = PlutusList.new()
  plutusList.add(participation)

  const plutusData = PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("1"), plutusList),
  )

  return plutusData
}

export function DelegatedRetractVote(participation: any) {
  const plutusList = PlutusList.new()
  plutusList.add(participation)

  const plutusData = PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("2"), plutusList),
  )

  return plutusData
}
/* GOV STATE REDEEMERS */

export function CreateNewTally(
  govStateInputIndex: string,
  govStateOutputIndex: string,
  tallyOutputindex: string,
) {
  const plutusList = PlutusList.new()
  plutusList.add(Integer(govStateInputIndex))
  plutusList.add(Integer(govStateOutputIndex))
  plutusList.add(Integer(tallyOutputindex))

  const plutusData = PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("1"), plutusList),
  )

  return plutusData
}

export function UpgradeGovState(
  govStateInputIndex: string,
  govStateOutputIndex: string,
  tallyInputIndex: string,
) {
  const plutusList = PlutusList.new()
  plutusList.add(Integer(govStateInputIndex))
  plutusList.add(Integer(govStateOutputIndex))
  plutusList.add(Integer(tallyInputIndex))

  const plutusData = PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("2"), plutusList),
  )

  return plutusData
}

/* TALLY AUTH REDEEMERS */

export function AuthRedeemer(
  spentUtxoIndex: string,
  governanceNftName: TokenBaseType,
) {
  const plutusList = PlutusList.new()
  plutusList.add(Integer(spentUtxoIndex))
  plutusList.add(TokenName(governanceNftName.tokenNameHex))

  const plutusData = PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("0"), plutusList),
  )

  return plutusData
}
