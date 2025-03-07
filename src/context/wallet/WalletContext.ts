import { createContext, Dispatch, SetStateAction } from "react"

export interface ContextValue {
  isConnected: boolean
  setIsConnected: Dispatch<SetStateAction<boolean>>
}

export default createContext<ContextValue | undefined>(undefined)
