import { FC, useState } from "react"
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Box,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Icon,
  useColorModeValue,
  Spinner,
  Flex,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react"
import { CheckCircleIcon, SettingsIcon } from "@chakra-ui/icons"
import { unlockTokens } from "../../cardano/staking/base"
import { formatNumber, fromNativeAmount } from "../../utils/numericHelpers"
import {
  GOV_TOKEN_DECIMALS,
  GOV_TOKEN_NAME_HEX,
  GOV_TOKEN_POLICY_ID,
  GOV_TOKEN_SYMBOL,
  VAULT_FT_TOKEN_POLICY_ID,
} from "../../cardano/config"
import { StakingPosition } from "../../api/model/staking"
import { Asset } from "../../api/model/common"
import { convertToValue } from "../../cardano/utils/utils.ts"

interface UnlockTokensModalProps {
  isOpen: boolean
  onClose: () => void
  position: StakingPosition
}

const UnlockTokensModal: FC<UnlockTokensModalProps> = ({
  isOpen,
  onClose,
  position,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [govAmount, setGovAmount] = useState<number>(0)
  const [ftUnlockOption, setFtUnlockOption] = useState<
    "expired" | "all" | "none"
  >("expired")

  const bgColor = useColorModeValue("background.light", "background.dark")
  const successColor = useColorModeValue("greens.500.light", "greens.500.dark")

  const getGovTokenAmount = (funds: Asset[]) => {
    const govFunds = funds.filter(
      (x) =>
        x.policy_id === GOV_TOKEN_POLICY_ID &&
        x.asset_name === GOV_TOKEN_NAME_HEX,
    )
    if (govFunds.length === 0) return 0
    return fromNativeAmount(govFunds[0].amount, GOV_TOKEN_DECIMALS)
  }

  const getFTAmount = (funds: Asset[]) => {
    const ftFunds = funds.filter(
      (x) => x.policy_id === VAULT_FT_TOKEN_POLICY_ID,
    )
    if (ftFunds.length === 0) return 0
    const ftSum = ftFunds.reduce((acc, curr) => acc + Number(curr.amount), 0)
    return fromNativeAmount(ftSum, GOV_TOKEN_DECIMALS)
  }

  const handleUnlockTokens = async () => {
    setIsLoading(true)
    setError(null)
    setTxHash(null)
    try {
      const hash = await unlockTokens(
        position.transaction_hash,
        position.output_index.toString(),
        convertToValue(position.funds),
        position.participations,
        position.datum,
        govAmount,
        ftUnlockOption,
      )
      setTxHash(hash)
    } catch (error) {
      console.error("Unlock transaction failed", error)
      setError("Unlock transaction failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setIsLoading(false)
    setError(null)
    setTxHash(null)
    setGovAmount(0)
    setFtUnlockOption("expired")
    onClose()
  }

  const maxGov = getGovTokenAmount(position.funds)
  const maxFT = getFTAmount(position.funds)
  const hasFT = typeof maxFT === 'number' ? maxFT > 0 : maxFT.gt(0)
  const isUnlockDisabled = govAmount <= 0 && !hasFT

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent bg={bgColor}>
        <ModalHeader textAlign="center" fontSize="xl" fontWeight="bold" p={4}>
          {isLoading
            ? "Unlocking Tokens"
            : txHash
              ? "Success"
              : "Unlock Tokens"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody p={6}>
          {isLoading ? (
            <Box textAlign="center">
              <Spinner size="xl" />
              <Text mt={4}>Unlocking tokens, please wait...</Text>
            </Box>
          ) : error ? (
            <Alert
              status="error"
              justifyItems="center"
              alignContent="center"
              gap="1em"
              borderRadius="8px"
            >
              <AlertIcon w={10} h={10} />
              <Box>
                <AlertTitle>Error!</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Box>
            </Alert>
          ) : txHash ? (
            <Box textAlign="center" color={successColor}>
              <Flex justify="center" align="center" gap="1em" mb="1em">
                <Icon as={CheckCircleIcon} w={10} h={10} />
                <Text fontSize="lg">Unlock Transaction Successful!</Text>
              </Flex>
              <Button
                as="a"
                href={`https://preprod.cardanoscan.io/transaction/${txHash}`}
                target="_blank"
                variant="link"
                m="1em"
                size="lg"
              >
                View on Cardanoscan
              </Button>
            </Box>
          ) : (
            <>
              <Box mb={4}>
                <Flex justify="space-between" align="center" mb={2}>
                  <Text fontSize="md">
                    <b>Tokens locked:</b>{" "}
                    {formatNumber(maxGov, GOV_TOKEN_DECIMALS)}{" "}
                    {GOV_TOKEN_SYMBOL} +{" "}
                    {formatNumber(maxFT, GOV_TOKEN_DECIMALS)} VaultFT
                  </Text>
                  {hasFT && (
                    <Menu>
                      <MenuButton as={Button} variant="ghost" size="sm" p={1}>
                        <Icon as={SettingsIcon} w={6} h={6} />
                      </MenuButton>
                      <MenuList>
                        <MenuItem onClick={() => setFtUnlockOption("expired")}>
                          Unlock expired VaultFTs
                        </MenuItem>
                        <MenuItem onClick={() => setFtUnlockOption("all")}>
                          Unlock all VaultFTs
                        </MenuItem>
                        <MenuItem onClick={() => setFtUnlockOption("none")}>
                          Unlock no VaultFTs
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  )}
                </Flex>
                <Box flex="1" mb={4}>
                  <Text mb={1}>{GOV_TOKEN_SYMBOL} to unlock:</Text>
                  <NumberInput
                    max={typeof maxGov === 'number' ? maxGov : maxGov.toNumber()}
                    min={0}
                    value={govAmount}
                    onChange={(value) => setGovAmount(Number(value))}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </Box>
                <Text fontSize="sm" color="gray.500" mb={4}>
                  {hasFT
                    ? `All expired VaultFTs are unlocked by default. Use settings to select a different option.`
                    : "No VaultFT locked."}
                </Text>
              </Box>
              <Flex justify="space-evenly" mt={6} gap={2}>
                <Button
                  onClick={handleUnlockTokens}
                  size="lg"
                  flex="1"
                  isDisabled={isUnlockDisabled}
                  isLoading={isLoading}
                >
                  Unlock
                </Button>
                <Button variant="outline" onClick={onClose} size="lg" flex="1">
                  Close
                </Button>
              </Flex>
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default UnlockTokensModal

// import { FC, useState } from "react"
// import {
//   Button,
//   Modal,
//   ModalOverlay,
//   ModalContent,
//   ModalHeader,
//   ModalCloseButton,
//   ModalBody,
//   Box,
//   Text,
//   Alert,
//   AlertIcon,
//   AlertTitle,
//   AlertDescription,
//   Icon,
//   useColorModeValue,
//   Spinner,
//   Flex,
//   NumberInput,
//   NumberInputField,
//   NumberInputStepper,
//   NumberIncrementStepper,
//   NumberDecrementStepper,
// } from "@chakra-ui/react"
// import { CheckCircleIcon } from "@chakra-ui/icons"
// import { unlockTokens } from "../../cardano/staking/base"
// import { formatNumber, fromNativeAmount, toNativeAmount } from "../../utils/numericHelpers"
// import {
//   GOV_TOKEN_DECIMALS,
//   GOV_TOKEN_NAME_HEX,
//   GOV_TOKEN_POLICY_ID,
//   GOV_TOKEN_SYMBOL,
//   VAULT_FT_TOKEN_POLICY_ID,
//   VAULT_FT_TOKEN_SYMBOL,
// } from "../../cardano/config"
// import { StakingPosition } from "../../api/model/staking"
// import { Asset } from "../../api/model/common"
// import { convertToValue } from "../../cardano/utils/utils.ts"

// interface UnlockTokensModalProps {
//   isOpen: boolean
//   onClose: () => void
//   position: StakingPosition
// }

// const UnlockTokensModal: FC<UnlockTokensModalProps> = ({
//   isOpen,
//   onClose,
//   position,
// }) => {
//   const [isLoading, setIsLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [txHash, setTxHash] = useState<string | null>(null)
//   const [govAmount, setGovAmount] = useState<number>(0)
//   const [ftAmount, setFtAmount] = useState<number>(0)

//   const bgColor = useColorModeValue("background.light", "background.dark")
//   const successColor = useColorModeValue("greens.500.light", "greens.500.dark")

//   const getGovTokenAmount = (funds: Asset[]) => {
//     const govFunds = funds.filter(
//       (x) =>
//         x.policy_id === GOV_TOKEN_POLICY_ID &&
//         x.asset_name === GOV_TOKEN_NAME_HEX
//     )
//     if (govFunds.length === 0) return 0
//     return fromNativeAmount(govFunds[0].amount, GOV_TOKEN_DECIMALS)
//   }

//   const getFTAmount = (funds: Asset[]) => {
//     const ftFunds = funds.filter((x) => x.policy_id === VAULT_FT_TOKEN_POLICY_ID)
//     if (ftFunds.length === 0) return 0
//     const ftSum = ftFunds.reduce((acc, curr) => acc + Number(curr.amount), 0)
//     return fromNativeAmount(ftSum, GOV_TOKEN_DECIMALS)
//   }

//   const handleUnlockTokens = async () => {
//     setIsLoading(true)
//     setError(null)
//     setTxHash(null)
//     try {
//       const hash = await unlockTokens(
//         position.transaction_hash,
//         position.output_index.toString(),
//         convertToValue(position.funds),
//         position.participations,
//         position.datum,
//         govAmount,
//         ftAmount,
//       )
//       setTxHash(hash)
//     } catch (error) {
//       console.error("Unlock transaction failed", error)
//       setError("Unlock transaction failed. Please try again.")
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const handleClose = () => {
//     setIsLoading(false)
//     setError(null)
//     setTxHash(null)
//     setGovAmount(0)
//     setFtAmount(0)
//     onClose()
//   }

//   const maxGov = getGovTokenAmount(position.funds)
//   const maxFT = getFTAmount(position.funds)

//   return (
//     <Modal isOpen={isOpen} onClose={handleClose}>
//       <ModalOverlay />
//       <ModalContent bg={bgColor}>
//         <ModalHeader textAlign="center" fontSize="xl" fontWeight="bold" p={4}>
//           {isLoading ? "Unlocking Tokens" : txHash ? "Success" : "Unlock Tokens"}
//         </ModalHeader>
//         <ModalCloseButton />
//         <ModalBody p={6}>
//           {isLoading ? (
//             <Box textAlign="center">
//               <Spinner size="xl" />
//               <Text mt={4}>Unlocking tokens, please wait...</Text>
//             </Box>
//           ) : error ? (
//             <Alert status="error" justifyItems="center" alignContent="center" gap="1em" borderRadius="8px">
//               <AlertIcon w={10} h={10} />
//               <Box>
//                 <AlertTitle>Error!</AlertTitle>
//                 <AlertDescription>{error}</AlertDescription>
//               </Box>
//             </Alert>
//           ) : txHash ? (
//             <Box textAlign="center" color={successColor}>
//               <Flex justify="center" align="center" gap="1em" mb="1em">
//                 <Icon as={CheckCircleIcon} w={10} h={10} />
//                 <Text fontSize="lg">Unlock Transaction Successful!</Text>
//               </Flex>
//               <Button
//                 as="a"
//                 href={`https://preprod.cardanoscan.io/transaction/${txHash}`}
//                 target="_blank"
//                 variant="link"
//                 m="1em"
//                 size="lg"
//               >
//                 View on Cardanoscan
//               </Button>
//             </Box>
//           ) : (
//             <>
//               <Box mb={4}>
//                 <Text fontSize="md" mb={2}><b>Tokens locked:</b> {formatNumber(maxGov, GOV_TOKEN_DECIMALS)} {GOV_TOKEN_SYMBOL} + {formatNumber(maxFT, GOV_TOKEN_DECIMALS)} VaultFT</Text>
//                 <Flex gap={4} mt={2}>
//                   <Box flex="1">
//                     <Text mb={1}>{GOV_TOKEN_SYMBOL} to unlock:</Text>
//                     <NumberInput
//                       max={maxGov}
//                       min={0}
//                       value={govAmount}
//                       onChange={(value) => setGovAmount(Number(value))}
//                     >
//                       <NumberInputField />
//                       <NumberInputStepper>
//                         <NumberIncrementStepper />
//                         <NumberDecrementStepper />
//                       </NumberInputStepper>
//                     </NumberInput>
//                   </Box>
//                   <Box flex="1">
//                     <Text mb={1}>{VAULT_FT_TOKEN_SYMBOL} to unlock:</Text>
//                     <NumberInput
//                       max={maxFT}
//                       min={0}
//                       value={ftAmount}
//                       onChange={(value) => setFtAmount(Number(value))}
//                     >
//                       <NumberInputField />
//                       <NumberInputStepper>
//                         <NumberIncrementStepper />
//                         <NumberDecrementStepper />
//                       </NumberInputStepper>
//                     </NumberInput>
//                   </Box>
//                 </Flex>
//               </Box>
//               <Flex justify="space-evenly" mt={6} gap={2}>
//                 <Button onClick={handleUnlockTokens} size="lg" flex="1" isDisabled={govAmount <= 0 && ftAmount <= 0}>
//                   Unlock
//                 </Button>
//                 <Button variant="outline" onClick={onClose} size="lg" flex="1">
//                   Close
//                 </Button>
//               </Flex>
//             </>
//           )}
//         </ModalBody>
//       </ModalContent>
//     </Modal>
//   )
// }

// export default UnlockTokensModal
