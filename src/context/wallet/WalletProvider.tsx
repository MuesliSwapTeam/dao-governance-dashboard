import { PropsWithChildren, useState } from "react"
import Context from "./WalletContext.js"

function WalletProvider({ children }: PropsWithChildren) {
  const [isConnected, setIsConnected] = useState(false)

  return (
    <Context.Provider value={{ isConnected, setIsConnected }}>
      {children}
    </Context.Provider>
  )
}

export default WalletProvider
