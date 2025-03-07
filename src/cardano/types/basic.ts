import {
  PlutusList,
  PlutusData,
  ConstrPlutusData,
  BigNum,
  BigInt,
  Value,
} from "@emurgo/cardano-serialization-lib-browser"
import { fromHex, valueToPlutusData } from "../utils/utils"

/*
    Definition of basic plutus data types used to build datums and redeemers
*/

export function Nothing() {
  return PlutusData.new_empty_constr_plutus_data(BigNum.from_str("6"))
}

export interface TokenBaseType {
  tokenPolicyId: string
  tokenNameHex: string
}

export function Token(tokenBase: TokenBaseType) {
  const tokenList = PlutusList.new()

  tokenList.add(PolicyId(tokenBase.tokenPolicyId))
  tokenList.add(TokenName(tokenBase.tokenNameHex))

  const tokenData = PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("0"), tokenList),
  )

  return tokenData
}

export function PolicyId(tokenPolicyId: string) {
  return Bytes(tokenPolicyId)
}

export function TokenName(tokenNameHex: string) {
  return Bytes(tokenNameHex)
}

export function Credential(isScript: boolean, credentialHash: string) {
  const scriptList = PlutusList.new()
  scriptList.add(PlutusData.new_bytes(fromHex(credentialHash)))

  let constructorNumber = "0"

  if (isScript) constructorNumber = "1"

  return PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str(constructorNumber), scriptList),
  )
}

export function StakingHash(credential: PlutusData) {
  const credentialList = PlutusList.new()
  credentialList.add(credential)

  const obj = PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("0"), credentialList),
  )

  const outerCredentialList = PlutusList.new()
  outerCredentialList.add(obj)

  return PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("0"), outerCredentialList),
  )
}

export function NoStakingCredential() {
  return PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("1"), PlutusList.new()),
  )
}

export interface AddressBaseType {
  isScript: boolean
  pubKeyHash: string
  stakeKeyHash: string | undefined
}

export function Address(addressBase: AddressBaseType) {
  const credentialList = PlutusList.new()

  const pubKeyHashCredential = Credential(
    addressBase.isScript,
    addressBase.pubKeyHash,
  )

  let stakeKeyHashCredential = NoStakingCredential()

  if (addressBase.stakeKeyHash != undefined) {
    const stakingCredential = Credential(false, addressBase.stakeKeyHash)
    stakeKeyHashCredential = StakingHash(stakingCredential)
  }

  credentialList.add(pubKeyHashCredential)
  credentialList.add(stakeKeyHashCredential)

  const addressData = PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("0"), credentialList),
  )

  return addressData
}

export function Integer(number: string) {
  const bigInt = BigInt.from_str(number)
  const plutusInt = PlutusData.new_integer(bigInt)
  return plutusInt
}

export function Bytes(byteString: string) {
  const plutusBytes = PlutusData.new_bytes(fromHex(byteString))
  return plutusBytes
}

export function EmptyList() {
  const plutusList = PlutusList.new()
  const plutusData = PlutusData.new_list(plutusList)
  return plutusData
}

export function TxId(txHash: string) {
  const list = PlutusList.new()
  const tx_id = PlutusData.new_bytes(fromHex(txHash))

  list.add(tx_id)

  return PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("0"), list),
  )
}

export function TxOutRef(txHash: string, outputIdx: string) {
  const plutusList = PlutusList.new()

  const id = TxId(txHash)
  plutusList.add(id)

  const idx = PlutusData.new_integer(BigInt.from_str(outputIdx))
  plutusList.add(idx)

  return PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("0"), plutusList),
  )
}

export interface FractionBaseType {
  numerator: string
  denominator: string
}

export function Fraction(fractionBase: FractionBaseType) {
  const fractionList = PlutusList.new()
  fractionList.add(Integer(fractionBase.numerator))
  fractionList.add(Integer(fractionBase.denominator))

  const fractionData = PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("1"), fractionList),
  )

  return fractionData
}
export function PosixTime(time: string) {
  return Integer(time)
}

export interface ExtendedPosixTimeBaseType {
  negInfBool: boolean
  time: string
  posInfBool: boolean
}

// if negInfBool or posInfBool true we assume we have an infinite number
export function ExtendedPosixTime(baseType: ExtendedPosixTimeBaseType) {
  if (baseType.negInfBool) {
    return PlutusData.new_constr_plutus_data(
      ConstrPlutusData.new(BigNum.from_str("0"), PlutusList.new()),
    )
  }

  if (baseType.posInfBool) {
    return PlutusData.new_constr_plutus_data(
      ConstrPlutusData.new(BigNum.from_str("2"), PlutusList.new()),
    )
  }

  const timeList = PlutusList.new()
  timeList.add(PlutusData.new_integer(BigInt.from_str(baseType.time)))

  return PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("1"), timeList),
  )
}

export function NoScriptHash() {
  return PlutusData.new_empty_constr_plutus_data(BigNum.from_str("1"))
}

export function SomeScriptHash(scriptHash: string) {
  const plutusList = PlutusList.new()
  plutusList.add(Bytes(scriptHash))

  const data = PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("0"), plutusList),
  )
  return data
}

export function NoOutputDatum() {
  return PlutusData.new_empty_constr_plutus_data(BigNum.from_str("0"))
}

// TODO: we need to add more supports like ScriptRef and other output datum types
export function TxOut(address: AddressBaseType, value: Value) {
  const plutusList = PlutusList.new()
  plutusList.add(Address(address))
  plutusList.add(valueToPlutusData(value))

  plutusList.add(NoOutputDatum())
  plutusList.add(NoScriptHash())

  return PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("0"), plutusList),
  )
}
