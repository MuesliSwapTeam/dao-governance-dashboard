import React, { useState, useEffect } from "react"
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  HStack,
  Text,
  Image,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Box,
  Divider,
  Badge,
  useColorModeValue,
  Flex,
  Icon,
} from "@chakra-ui/react"
import { FaCoins, FaTrash } from "react-icons/fa"
import { useGetTreasuryFundsQuery } from "../../../api/treasuryApi"
import { TreasuryAsset } from "../../../api/model/treasury"
import { Asset } from "../../../api/model/tally"
import {
  formatNumber,
  fromNativeAmount,
  toNativeAmount,
} from "../../../utils/numericHelpers"

interface SelectedAsset extends Asset {
  maxAmount: number
  symbol: string
  image: string
  decimalPlaces: number
  minimumAmount: number
  uiValue: string
}

interface TreasuryAssetSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (assets: Asset[]) => void
  initialAssets?: Asset[]
}

const TreasuryAssetSelectionModal: React.FC<
  TreasuryAssetSelectionModalProps
> = ({ isOpen, onClose, onConfirm, initialAssets = [] }) => {
  const { data: treasuryAssets = [], isLoading } = useGetTreasuryFundsQuery()
  const [selectedAssets, setSelectedAssets] = useState<SelectedAsset[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const bgColor = useColorModeValue("white", "gray.700")
  const borderColor = useColorModeValue("gray.200", "gray.600")
  const textColor = useColorModeValue("gray.800", "white")

  // Initialize selected assets from initialAssets
  useEffect(() => {
    if (initialAssets.length > 0 && treasuryAssets.length > 0) {
      const mappedAssets: SelectedAsset[] = initialAssets.map((asset) => {
        const treasuryAsset = treasuryAssets.find((ta) => {
          if (asset.unit === "lovelace") {
            return ta.policy_id === "" && ta.asset_name === ""
          }
          return ta.policy_id + ta.asset_name === asset.unit
        })

        // Handle ADA token display
        const isADA = asset.unit === "lovelace"
        const symbol = isADA ? "ADA" : treasuryAsset?.symbol || "Unknown"
        const image = isADA
          ? "https://muesliswap.com/static/media/ada.ae3e320f25e324286ae2.webp"
          : treasuryAsset?.image ||
            "https://static.muesliswap.com/images/tokens/empty.png"
        const decimalPlaces = isADA ? 6 : treasuryAsset?.decimalPlaces || 0
        const minimumAmount = 0

        return {
          ...asset,
          maxAmount: treasuryAsset ? Number(treasuryAsset.amount) : 0,
          symbol,
          image,
          decimalPlaces,
          minimumAmount,
          uiValue: formatNumber(
            fromNativeAmount(asset.quantity, decimalPlaces),
            decimalPlaces,
          ),
        }
      })
      setSelectedAssets(mappedAssets)
    } else {
      setSelectedAssets([])
    }
  }, [initialAssets, treasuryAssets])

  const addAsset = (treasuryAsset: TreasuryAsset) => {
    const unit =
      treasuryAsset.policy_id === "" && treasuryAsset.asset_name === ""
        ? "lovelace"
        : treasuryAsset.policy_id + treasuryAsset.asset_name

    // Check if asset is already selected
    if (selectedAssets.some((asset) => asset.unit === unit)) {
      return
    }

    // Handle ADA token display
    const isADA =
      treasuryAsset.policy_id === "" && treasuryAsset.asset_name === ""
    const symbol = isADA ? "ADA" : treasuryAsset.symbol
    const image = isADA
      ? "https://muesliswap.com/static/media/ada.ae3e320f25e324286ae2.webp"
      : treasuryAsset.image
    const decimalPlaces = isADA ? 6 : treasuryAsset.decimalPlaces

    const minimumAmount = 0

    const newAsset: SelectedAsset = {
      unit,
      quantity: 0,
      maxAmount: Number(treasuryAsset.amount),
      symbol,
      image,
      decimalPlaces,
      minimumAmount,
      uiValue: "0",
    }

    setSelectedAssets([...selectedAssets, newAsset])
  }

  const removeAsset = (unit: string) => {
    setSelectedAssets(selectedAssets.filter((asset) => asset.unit !== unit))
    // Clear any errors for this asset
    const newErrors = { ...errors }
    delete newErrors[unit]
    setErrors(newErrors)
  }

  const handleConfirm = () => {
    // Validate all assets
    const hasErrors = selectedAssets.some(
      (asset) => asset.quantity <= 0 || asset.quantity > asset.maxAmount,
    )

    if (hasErrors) {
      // Set errors for invalid assets
      const newErrors: Record<string, string> = {}
      selectedAssets.forEach((asset) => {
        if (asset.quantity <= 0) {
          newErrors[asset.unit] = "Amount must be greater than 0"
        } else if (asset.quantity > asset.maxAmount) {
          newErrors[asset.unit] =
            `Amount cannot exceed treasury balance of ${asset.maxAmount}`
        }
      })
      setErrors(newErrors)
      return
    }

    // Convert to Asset format and confirm
    const assets: Asset[] = selectedAssets.map(
      ({ unit, quantity, decimalPlaces }) => ({
        unit,
        quantity,
        decimalPlaces,
      }),
    )

    onConfirm(assets)
    onClose()
  }

  const availableAssets = treasuryAssets.filter(
    (ta) =>
      !selectedAssets.some((sa) => {
        const unit =
          ta.policy_id === "" && ta.asset_name === ""
            ? "lovelace"
            : ta.policy_id + ta.asset_name
        return sa.unit === unit
      }),
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent bg={bgColor}>
        <ModalHeader>
          <Flex align="center">
            <Icon as={FaCoins} mr={2} />
            <Text>Select Treasury Assets</Text>
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody mb={14}>
          <VStack spacing={6} align="stretch">
            {/* Available Assets */}
            <Box>
              <Text fontWeight="bold" mb={3} color={textColor}>
                Available Assets
              </Text>
              <VStack spacing={3} align="stretch" maxH="200px" overflowY="auto">
                {isLoading ? (
                  <Text>Loading treasury assets...</Text>
                ) : availableAssets.length === 0 ? (
                  <Text color="gray.500">No available assets to select</Text>
                ) : (
                  availableAssets.map((asset, index) => {
                    // Handle ADA token display
                    const isADA =
                      asset.policy_id === "" && asset.asset_name === ""
                    const symbol = isADA ? "ADA" : asset.symbol
                    const image = isADA
                      ? "https://muesliswap.com/static/media/ada.ae3e320f25e324286ae2.webp"
                      : asset.image
                    const decimalPlaces = isADA ? 6 : asset.decimalPlaces

                    return (
                      <Button
                        key={index}
                        variant="outline"
                        justifyContent="space-between"
                        onClick={() => addAsset(asset)}
                        size="sm"
                      >
                        <HStack>
                          <Image
                            boxSize="20px"
                            src={image}
                            alt={symbol}
                            fallbackSrc="https://static.muesliswap.com/images/tokens/empty.png"
                          />
                          <Text>{symbol}</Text>
                        </HStack>
                        <Badge colorScheme="blue">
                          {formatNumber(
                            fromNativeAmount(asset.amount, decimalPlaces),
                            decimalPlaces,
                          )}
                        </Badge>
                      </Button>
                    )
                  })
                )}
              </VStack>
            </Box>

            <Divider />

            {/* Selected Assets */}
            <Box>
              <Text fontWeight="bold" mb={3} color={textColor}>
                Selected Assets
              </Text>
              {selectedAssets.length === 0 ? (
                <Box
                  p={6}
                  bg={useColorModeValue("gray.50", "gray.600")}
                  borderRadius="md"
                  border="1px dashed"
                  borderColor={borderColor}
                  mb={6}
                >
                  <Text color="gray.500" fontStyle="italic" textAlign="center">
                    No assets selected. Click on an available asset above to add
                    it.
                  </Text>
                </Box>
              ) : (
                <VStack spacing={3} align="stretch">
                  {selectedAssets.map((asset) => (
                    <Box
                      key={asset.unit}
                      p={3}
                      border="1px solid"
                      borderColor={borderColor}
                      borderRadius="md"
                      bg={useColorModeValue("gray.50", "gray.600")}
                    >
                      <HStack justify="space-between" mb={2}>
                        <HStack>
                          <Image
                            boxSize="24px"
                            src={asset.image}
                            alt={asset.symbol}
                            fallbackSrc="https://static.muesliswap.com/images/tokens/empty.png"
                          />
                          <Text fontWeight="bold">{asset.symbol}</Text>
                          <Badge>
                            Max:{" "}
                            {formatNumber(
                              fromNativeAmount(
                                asset.maxAmount,
                                asset.decimalPlaces,
                              ),
                              asset.decimalPlaces,
                            )}
                          </Badge>
                        </HStack>
                        <Button
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => removeAsset(asset.unit)}
                        >
                          <Icon as={FaTrash} />
                        </Button>
                      </HStack>

                      <FormControl isInvalid={!!errors[asset.unit]}>
                        <FormLabel fontSize="sm">Amount</FormLabel>
                        <NumberInput
                          value={asset.uiValue}
                          onChange={(valueStr, valueNum) => {
                            // Update both uiValue and quantity in a single state update
                            setSelectedAssets((prev) =>
                              prev.map((a) => {
                                if (a.unit === asset.unit) {
                                  const updatedAsset = {
                                    ...a,
                                    uiValue: valueStr,
                                  }

                                  // Only update numeric quantity when it's a valid finite number
                                  if (
                                    valueStr !== "" &&
                                    valueStr !== "-" &&
                                    valueStr !== "." &&
                                    !valueStr.endsWith(".")
                                  ) {
                                    if (
                                      !isNaN(valueNum) &&
                                      isFinite(valueNum)
                                    ) {
                                      const nativeAmount = Number(
                                        toNativeAmount(
                                          valueNum,
                                          asset.decimalPlaces,
                                        ),
                                      )
                                      updatedAsset.quantity = nativeAmount

                                      // Validate quantity
                                      const newErrors = { ...errors }
                                      if (nativeAmount > a.maxAmount) {
                                        newErrors[asset.unit] =
                                          `Amount cannot exceed treasury balance of ${formatNumber(fromNativeAmount(a.maxAmount, a.decimalPlaces), a.decimalPlaces)}`
                                      } else if (nativeAmount <= 0) {
                                        newErrors[asset.unit] =
                                          `Amount must be greater than 0. Please remember minUTXO requirements at payout.`
                                      } else {
                                        delete newErrors[asset.unit]
                                      }
                                      setErrors(newErrors)
                                    }
                                  }

                                  return updatedAsset
                                }
                                return a
                              }),
                            )
                          }}
                          max={fromNativeAmount(
                            asset.maxAmount,
                            asset.decimalPlaces,
                          ).toNumber()}
                          size="sm"
                          step={Math.pow(10, -asset.decimalPlaces)}
                          precision={asset.decimalPlaces}
                          allowMouseWheel
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                        {errors[asset.unit] && (
                          <FormErrorMessage>
                            {errors[asset.unit]}
                          </FormErrorMessage>
                        )}
                      </FormControl>
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>

            {selectedAssets.length > 0 && (
              <Box
                p={4}
                bg={useColorModeValue("blue.50", "blue.900")}
                borderRadius="md"
                mt={4}
                mb={2}
              >
                <Text
                  fontSize="sm"
                  color={useColorModeValue("blue.700", "blue.200")}
                  textAlign="center"
                >
                  Total assets selected: {selectedAssets.length}
                </Text>
              </Box>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter mt={20} pb={10}>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleConfirm}
            isDisabled={
              selectedAssets.length === 0 || Object.keys(errors).length > 0
            }
          >
            Confirm Selection
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default TreasuryAssetSelectionModal
