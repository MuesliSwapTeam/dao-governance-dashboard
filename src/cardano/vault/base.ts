import { getWallet, getWalletAddress } from "../wallet.ts"
import { toast } from "../../components/ToastContainer.ts"
import { VaultPosition } from "../../api/model/vault.ts"
import { vaultApi } from "../../api/vaultApi.ts"
import { store } from "../../store.ts"

export async function openVaultPosition(
  amount: number,
  lockingPeriod: number, // in weeks
) {
  const wallet = await getWallet()
  const address = await getWalletAddress()

  let signed_tx: string
  let tx_body: string

  try {
    const action = vaultApi.endpoints.getOpenVaultPositionTransaction.initiate
    const getOpenVaultPositionTransaction = action({
      address: address as string,
      amount,
      locked_weeks: lockingPeriod,
    })

    ;({ signed_tx, tx_body } = await store
      .dispatch(getOpenVaultPositionTransaction)
      .unwrap())

    console.log("Transaction:", tx_body)
  } catch (error) {
    console.error("Failed to get vault position transaction:", error)
    throw error
  }

  let txVkeyWitnesses, signError
  try {
    txVkeyWitnesses = await wallet.signTx(signed_tx, true)
  } catch (error) {
    console.error("Transaction signing failed", error)
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

  try {
    const action = vaultApi.endpoints.appendSignature.initiate
    const getAppendSignature = action({
      tx: signed_tx,
      tx_body: tx_body,
      witness_set: txVkeyWitnesses,
    })
    signed_tx = await store.dispatch(getAppendSignature).unwrap()
    console.log("Signed Transaction:", signed_tx)
  } catch (error) {
    console.error("Failed to append signature:", error)
    throw error
  }

  try {
    const txHash = await wallet.submitTx(signed_tx)
    console.log("Open vault position:", txHash)
    toast({
      title: "Opened vault position.",
      description: "Opened vault position successfully.",
      status: "success",
      duration: 5000,
      isClosable: true,
    })
    return txHash
  } catch (error) {
    console.error("Transaction submission failed", error)
    toast({
      title: "Transaction submission failed",
      description: "Please try again.",
      status: "error",
      duration: 5000,
      isClosable: true,
    })
    throw error
  }
}

export async function mintVaultFT(position: VaultPosition) {
  const wallet = await getWallet()
  const address = await getWalletAddress()

  let signed_tx: string
  let tx_body: string

  try {
    const action = vaultApi.endpoints.getMintVaultFTTransaction.initiate
    const getMintVaultFTTransaction = action({
      address: address as string,
      tx_hash: position.transaction_hash,
      output_index: position.output_index,
    })
    ;({ signed_tx, tx_body } = await store
      .dispatch(getMintVaultFTTransaction)
      .unwrap())
    console.log("Transaction:", tx_body)
  } catch (error) {
    console.error("Failed to get mint vault FT transaction:", error)
    throw error
  }

  let txVkeyWitnesses, signError
  try {
    txVkeyWitnesses = await wallet.signTx(signed_tx, true)
  } catch (error) {
    console.error("Transaction signing failed", error)
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

  try {
    const action = vaultApi.endpoints.appendSignature.initiate
    const getAppendSignature = action({
      tx: signed_tx,
      tx_body: tx_body,
      witness_set: txVkeyWitnesses,
    })
    signed_tx = await store.dispatch(getAppendSignature).unwrap()
    console.log("Signed Transaction:", signed_tx)
  } catch (error) {
    console.error("Failed to append signature:", error)
    throw error
  }

  try {
    const txHash = await wallet.submitTx(signed_tx)
    console.log("Mint Vote FTs:", txHash)
    toast({
      title: "Minted Vault FTs.",
      description: "Minted Vault FTs successfully.",
      status: "success",
      duration: 5000,
      isClosable: true,
    })
    return txHash
  } catch (error) {
    console.error("Transaction submission failed", error)
    toast({
      title: "Transaction submission failed",
      description: "Please try again.",
      status: "error",
      duration: 5000,
      isClosable: true,
    })
    throw error
  }
}

export async function closeVaultPosition(position: VaultPosition) {
  const wallet = await getWallet()
  const address = await getWalletAddress()

  let signed_tx: string
  let tx_body: string

  try {
    const action = vaultApi.endpoints.getCloseVaultPositionTransaction.initiate
    const getCloseVaultPositionTransaction = action({
      address: address as string,
      tx_hash: position.transaction_hash,
      output_index: position.output_index,
    })

    ;({ signed_tx, tx_body } = await store
      .dispatch(getCloseVaultPositionTransaction)
      .unwrap())

    console.log("Transaction:", tx_body)
  } catch (error) {
    console.error("Failed to get vault position transaction:", error)
    throw error
  }

  let txVkeyWitnesses, signError
  try {
    txVkeyWitnesses = await wallet.signTx(signed_tx, true)
  } catch (error) {
    console.error("Transaction signing failed", error)
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

  try {
    const action = vaultApi.endpoints.appendSignature.initiate
    const getAppendSignature = action({
      tx: signed_tx,
      tx_body: tx_body,
      witness_set: txVkeyWitnesses,
    })
    signed_tx = await store.dispatch(getAppendSignature).unwrap()
    console.log("Signed Transaction:", signed_tx)
  } catch (error) {
    console.error("Failed to append signature:", error)
    throw error
  }

  try {
    const txHash = await wallet.submitTx(signed_tx)
    console.log("Close vault position:", txHash)
    toast({
      title: "Closed vault position.",
      description: "Closed vault position successfully.",
      status: "success",
      duration: 5000,
      isClosable: true,
    })
    return txHash
  } catch (error) {
    console.error("Transaction submission failed", error)
    toast({
      title: "Transaction submission failed",
      description: "Please try again.",
      status: "error",
      duration: 5000,
      isClosable: true,
    })
    throw error
  }
}
