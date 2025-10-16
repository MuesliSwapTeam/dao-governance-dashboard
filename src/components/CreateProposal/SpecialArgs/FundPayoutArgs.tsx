import { Asset, FundPayoutArgs } from "../../../api/model/tally"
import {
  Button,
  Flex,
  Icon,
  Text,
  useDisclosure,
  VStack,
  HStack,
  Badge,
  Image,
  Box,
  useColorModeValue,
} from "@chakra-ui/react"
import { FaCoins, FaWallet, FaEdit } from "react-icons/fa"
import ProposalTextInput from "../ProposalTextInput"
import { Field, FieldProps, useField } from "formik"
import TreasuryAssetSelectionModal from "./TreasuryAssetSelectionModal"
import { useGetTreasuryFundsQuery } from "../../../api/treasuryApi"
import { formatNumber, fromNativeAmount } from "../../../utils/numericHelpers"

const AssetSelectionDisplay = ({ assets }: { assets: Asset[] }) => {
  const { data: treasuryAssets = [] } = useGetTreasuryFundsQuery()

  // Color mode values for proper dark mode support
  const listItemBg = useColorModeValue("gray.50", "gray.800")
  const textColor = useColorModeValue("gray.800", "white")

  if (assets.length === 0) {
    return (
      <Text color="gray.500" fontStyle="italic">
        No assets selected
      </Text>
    )
  }

  return (
    <VStack spacing={2} align="stretch">
      {assets.map((asset, index) => {
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

        return (
          <HStack
            key={index}
            justify="space-between"
            p={2}
            bg={listItemBg}
            borderRadius="md"
          >
            <HStack>
              <Image
                boxSize="20px"
                src={image}
                alt={symbol}
                fallbackSrc="https://static.muesliswap.com/images/tokens/empty.png"
              />
              <Text fontWeight="medium" color={textColor}>
                {symbol}
              </Text>
            </HStack>
            <Badge colorScheme="blue" variant="subtle">
              {formatNumber(
                fromNativeAmount(asset.quantity, asset.decimalPlaces),
                asset.decimalPlaces,
              )}
            </Badge>
          </HStack>
        )
      })}
    </VStack>
  )
}

export const FUND_PAYOUT_DEFAULT_VALUES: FundPayoutArgs = {
  address: "",
  assets: [],
}

const FundPayoutArgsInput = (props: { idx: number }) => {
  const [{ value: address }, , { setValue: setAddress }] = useField(
    `votes[${props.idx}].args.address`,
  )
  const [{ value: assets }, , { setValue: setAssets }] = useField(
    `votes[${props.idx}].args.assets`,
  )
  const [, , { setError, setTouched }] = useField(
    `votes[${props.idx}].args.assets`,
  )

  const { isOpen, onOpen, onClose } = useDisclosure()

  const handleAssetSelection = (selectedAssets: Asset[]) => {
    setAssets(selectedAssets)
    // Clear any existing error when assets are selected
    setError(undefined)
    // Use setTimeout to ensure validation runs after state updates
    setTimeout(() => {
      setTouched(true)
    }, 0)
  }

  const handleOpenModal = () => {
    onOpen()
  }

  return (
    <>
      <Field name={`votes[${props.idx}].args.address`}>
        {({ form, meta }: FieldProps) => (
          <ProposalTextInput
            icon={FaWallet}
            value={address}
            placeholder="addr458ks2..."
            title="Destination Wallet"
            disabled={form.isSubmitting}
            setValue={setAddress}
            error={meta.touched && meta.error ? meta.error : undefined}
          />
        )}
      </Field>

      <Field name={`votes[${props.idx}].args.assets`}>
        {({ meta }: FieldProps) => (
          <Box>
            <Flex align="center" ml="8px" mb="8px" justify="space-between">
              <Flex align="center">
                <Icon as={FaCoins} mr={2} />
                <Text>Assets</Text>
              </Flex>
              <Button
                size="sm"
                leftIcon={<FaEdit />}
                onClick={handleOpenModal}
                variant="outline"
              >
                {assets && assets.length > 0 ? "Edit Assets" : "Select Assets"}
              </Button>
            </Flex>

            <Box ml="8px" mb="8px">
              <AssetSelectionDisplay assets={assets || []} />
              {meta.touched && meta.error && (
                <Text color="red.500" fontSize="sm" mt={2}>
                  {meta.error}
                </Text>
              )}
            </Box>
          </Box>
        )}
      </Field>

      <TreasuryAssetSelectionModal
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={handleAssetSelection}
        initialAssets={assets || []}
      />
    </>
  )
}

export default FundPayoutArgsInput
