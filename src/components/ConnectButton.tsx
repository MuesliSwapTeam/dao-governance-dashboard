import { ConnectWalletList } from "@cardano-foundation/cardano-connect-with-wallet"
import { useCallback, useEffect, useRef } from "react"
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  useDisclosure,
  useTheme,
  useColorMode,
} from "@chakra-ui/react"
import { LuWallet } from "react-icons/lu"

import { restoreWallet, setWallet, wrongNetworkToast } from "../cardano/wallet"
import useWalletContext from "../context/wallet"
import { toast } from "./ToastContainer"

function ConnectButton({ longName = false }: { longName?: boolean }) {
  const { colorMode } = useColorMode()
  const { colors } = useTheme()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isConnected, setIsConnected } = useWalletContext()
  const setConnector = useCallback(
    async (connectorName: string | undefined) => {
      await setWallet(connectorName)
      setIsConnected(connectorName != null)
      if (connectorName != null) onClose()
    },
    [setIsConnected, onClose],
  )

  // Auto reconnect
  const reconnecting = useRef(false)
  useEffect(() => {
    if (!isConnected && !reconnecting.current) {
      reconnecting.current = true
      restoreWallet().then((success) => {
        if (success) setIsConnected(true)
      })
    }
  }, [setIsConnected])

  return (
    <>
      {isConnected ? (
        <Button
          onClick={() => setConnector(undefined)}
          ml={2}
          mr={4}
          leftIcon={<LuWallet />}
        >
          Disconnect {longName && "Wallet"}
        </Button>
      ) : (
        <Button onClick={onOpen} ml={2} mr={4} leftIcon={<LuWallet />}>
          Connect {longName && "Wallet"}
        </Button>
      )}

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Connect Wallet</ModalHeader>
          <ModalCloseButton />
          <ModalBody w="100%">
            <ConnectWalletList
              limitNetwork={"mainnet" as never}
              borderRadius={15}
              gap={12}
              primaryColor={
                colorMode === "dark" ? colors.accent.dark : colors.accent.light
              }
              onConnect={setConnector}
              onConnectError={(walletName, error) => {
                if (error.name === "WrongNetworkTypeError") {
                  wrongNetworkToast()
                } else {
                  toast({
                    title: "Connection Error",
                    description:
                      "We could not establish a connection to your wallet. Please try again later",
                    status: "error" as "error",
                    duration: 5000,
                    isClosable: false,
                  })
                  console.error(
                    `An error occurred while connecting to ${walletName}`,
                  )
                  console.error(error)
                }
              }}
              customCSS={`
        font-family: Helvetica Light,sans-serif;
        font-size: 0.875rem;
        font-weight: 700;
        width: 100%;
        max-width: 100%;
        & > span { padding: 5px 16px; width: 100%; font-size: 1.2em; border-radius: 0.375em  }
        & > span > img { width: auto; height: 2em; }
    `}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}

export default ConnectButton
