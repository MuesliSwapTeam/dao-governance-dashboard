import { useContext } from "react"
import WalletContext, { ContextValue } from "./WalletContext"

function useWalletContext(): ContextValue {
  const value = useContext(WalletContext)
  if (!value) {
    throw new Error("useWalletContext was used outside a ContextProvider")
  }

  return value
}

export default useWalletContext
