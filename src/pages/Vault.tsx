// Vault.tsx
import { FC, useEffect, useState } from "react"
import {
  Box,
  Heading,
  Text,
  VStack,
  Spinner,
  Flex,
  Button,
  useDisclosure,
  useColorModeValue,
} from "@chakra-ui/react"
import LockTokensModal from "../components/Vault/LockTokensModal"
import UnlockTokensModal from "../components/Vault/UnlockTokensModal"
import VaultTable from "../components/Vault/VaultTable"
import { getGovernanceTokenBalance, getWalletAddress } from "../cardano/wallet"
import { fromNativeAmount } from "../utils/numericHelpers"
import { GOV_TOKEN_DECIMALS, GOV_TOKEN_SYMBOL } from "../cardano/config"
import { skipToken } from "@reduxjs/toolkit/query/react"
import useWalletContext from "../context/wallet"
import { VaultPosition } from "../api/model/vault"
import { useGetVaultPositionsQuery } from "../api/vaultApi"
import { mintVaultFT } from "../cardano/vault/base"

const displayLockDate = (unlockDate: Date) => {
  return `${unlockDate.toLocaleDateString()} ${unlockDate.toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  )}`
}

const Vault: FC = () => {
  const { isConnected } = useWalletContext()
  const [walletPkhHex, setWalletPkhHex] = useState<string | null>(null)
  const [selectedUnlockStakePosition, setSelectedUnlockStakePosition] =
    useState<VaultPosition | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [expandedPositionIndex, setExpandedPositionIndex] = useState<
    number | null
  >(null)
  const [balance, setBalance] = useState(0)

  // Styles
  const bgColor = useColorModeValue("background.light", "background.dark")
  const disabledColor = useColorModeValue("grays.300.dark", "grays.600.dark")

  // Effects
  useEffect(() => {
    if (!isConnected) return

    const updateBalance = async () => {
      const b = await getGovernanceTokenBalance()
      setBalance(fromNativeAmount(b, GOV_TOKEN_DECIMALS).toNumber())
    }

    updateBalance()
    const interval = setInterval(updateBalance, 1000)
    return () => clearInterval(interval)
  }, [isConnected])

  useEffect(() => {
    const fetchWalletAddress = async () => {
      try {
        let address = await getWalletAddress()
        if (address) address = address.slice(2, 58)
        setWalletPkhHex((prevAddress) =>
          prevAddress !== address ? address : prevAddress,
        )
      } catch (error) {
        console.error("Failed to fetch wallet address", error)
      }
    }
    if (isConnected) {
      fetchWalletAddress()
    }
  }, [isConnected])

  // Data fetching
  const {
    data: vaultPositions = [],
    isLoading,
    isUninitialized,
  } = useGetVaultPositionsQuery(
    walletPkhHex ? { pkh: walletPkhHex } : skipToken,
  )

  // Handlers
  const handleUnlockClick = (position: VaultPosition) => {
    setSelectedUnlockStakePosition(position)
  }

  const handleCloseUnlockModal = () => {
    setSelectedUnlockStakePosition(null)
  }

  const handleMintFTClick = async (position: VaultPosition) => {
    try {
      const hash = await mintVaultFT(position)
      console.log("Transaction hash:", hash)
    } catch (error) {
      console.error("Transaction failed", error)
    }
  }

  return (
    <Box m="24px 16px" sx={{ textAlign: "start" }}>
      <VStack align="start" spacing={4} w="100%">
        <Flex justify="space-between" align="center" w="100%" gap={10}>
          {/* Description Box */}
          <Box>
            <Heading as="h2" size="lg">
              Tokens Locked for Rewards
            </Heading>
            <Text fontSize="md">
              Thanks to our innovative Vote FTs, you can still vote with your
              MILK while it's earning you rewards!
            </Text>
          </Box>

          {/* Balance Box */}
          {isConnected && (
            <Box
              bg={bgColor}
              p={4}
              borderRadius="md"
              boxShadow="md"
              borderWidth="1px"
              textAlign="left"
            >
              <Text fontSize="md">
                <b>{GOV_TOKEN_SYMBOL} Balance:</b> {balance}
              </Text>
              <Button
                width="100%"
                onClick={onOpen}
                isDisabled={balance <= 0}
                mt={2}
                bg={balance <= 0 ? disabledColor : undefined}
                _disabled={{ cursor: "not-allowed" }}
              >
                Lock {GOV_TOKEN_SYMBOL}
              </Button>
            </Box>
          )}
        </Flex>

        {/* LockTokensModal */}
        <LockTokensModal isOpen={isOpen} onClose={onClose} balance={balance} />

        {/* Stake Positions Table */}
        {isLoading || (isUninitialized && isConnected) ? (
          <Flex justify="center" align="center" w="100%" h="20vh">
            <Spinner size="xl" />
          </Flex>
        ) : vaultPositions.length > 0 ? (
          <Box
            bg={bgColor}
            p={4}
            borderRadius="md"
            boxShadow="md"
            borderWidth="1px"
            width="100%"
            overflowX="auto"
          >
            <VaultTable
              vaultPositions={vaultPositions}
              expandedPositionIndex={expandedPositionIndex}
              setExpandedPositionIndex={setExpandedPositionIndex}
              handleUnlockClick={handleUnlockClick}
              handleMintFTClick={handleMintFTClick}
              displayLockDate={displayLockDate}
            />
          </Box>
        ) : (
          <Box
            bg={bgColor}
            p={4}
            borderRadius="md"
            boxShadow="md"
            borderWidth="1px"
            width="100%"
            textAlign="center"
          >
            <Text fontSize="md">
              {isConnected ? (
                <b>
                  Currently no tokens locked. Lock {GOV_TOKEN_SYMBOL} to
                  participate in DAO governance.
                </b>
              ) : (
                <b>
                  Connect your wallet to see your currently locked{" "}
                  {GOV_TOKEN_SYMBOL} and stake more.
                </b>
              )}
            </Text>
          </Box>
        )}
      </VStack>

      {/* UnlockTokensModal */}
      {selectedUnlockStakePosition && (
        <UnlockTokensModal
          isOpen={!!selectedUnlockStakePosition}
          onClose={handleCloseUnlockModal}
          position={selectedUnlockStakePosition}
        />
      )}
    </Box>
  )
}

export default Vault
