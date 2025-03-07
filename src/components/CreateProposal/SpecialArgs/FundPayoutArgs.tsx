import { Fragment, useState } from "react"
import { Asset, FundPayoutArgs } from "../../../api/model/tally"
import {
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  Grid,
  Icon,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import { FaCoins, FaWallet } from "react-icons/fa"
import ProposalTextInput from "../ProposalTextInput"
import { Field, FieldProps, useField } from "formik"
import { skipToken } from "@reduxjs/toolkit/query"
import { useGetCuratedTokensQuery } from "../../../api/tokensApi"
import { toNativeAmount } from "../../../utils/numericHelpers"

interface Token {
  image: string
  address: { name: string; policyId: string }
  symbol: string
  decimalPlaces: number
}

const DEFAULT_TOKEN: Token = {
  image: "https://muesliswap.com/static/media/ada.ae3e320f25e324286ae2.webp",
  symbol: "ADA",
  address: { name: "lovelace", policyId: "" },
  decimalPlaces: 6,
}

const TokenSelectionButton = (props: {
  initialValue: Token
  onSelect: (token: Token) => void
  disabled?: boolean
}) => {
  const { isOpen, onClose, onOpen } = useDisclosure()
  const [selectedToken, setSelectedToken] = useState<Token>(props.initialValue)

  const { data: tokens = [] } = useGetCuratedTokensQuery(
    !isOpen ? skipToken : null,
  )

  const handleTokenSelect = (token: Token) => {
    setSelectedToken(token)
    props.onSelect(token)
    onClose()
  }

  return (
    <>
      <Button
        h="2rem"
        variant="ghost"
        onClick={onOpen}
        leftIcon={
          selectedToken ? (
            <Image
              boxSize="20px"
              src={selectedToken.image}
              alt={selectedToken.symbol}
            />
          ) : (
            <FaCoins />
          )
        }
        aria-label="Select Token"
        isDisabled={props.disabled}
      >
        {selectedToken ? selectedToken.symbol : "Select Token"}
      </Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Select Token</ModalHeader>
          <ModalCloseButton />
          <ModalBody w="100%">
            <VStack spacing={4} align="stretch">
              {tokens.map((token, index) => (
                <Button
                  key={index}
                  onClick={() => handleTokenSelect(token)}
                  variant={
                    selectedToken?.symbol === token.symbol ? "solid" : "outline"
                  }
                  justifyContent="space-between"
                >
                  <Image boxSize="24px" src={token.image} alt={token.symbol} />
                  <Text fontWeight="bold">{token.symbol}</Text>
                </Button>
              ))}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}

const AssetSelection = (props: { idx: number; voteIdx: number }) => {
  const [token, setToken] = useState<Token>(DEFAULT_TOKEN)
  const [amountStr, setAmountStr] = useState<string>()
  const [, , { setValue: setAmount, setTouched: setAmountTouched }] = useField(
    `votes[${props.voteIdx}].args.assets[${props.idx}].quantity`,
  )
  const [, , { setValue: setUnit, setTouched: setUnitTouched }] = useField(
    `votes[${props.voteIdx}].args.assets[${props.idx}].unit`,
  )

  return (
    <>
      <Grid
        w="100%"
        h="fit-content"
        templateColumns="1fr auto"
        gap="1em"
        mt="0.6em"
      >
        <Field
          name={`votes[${props.voteIdx}].args.assets[${props.idx}].quantity`}
        >
          {({ form, meta }: FieldProps) => (
            <FormControl isInvalid={meta.touched && !!meta.error}>
              <NumberInput
                value={amountStr}
                onChange={(v) => {
                  if (Number.isFinite(+v) && !Number.isNaN(+v)) {
                    setAmountStr(v)
                    setAmount(toNativeAmount(Number(v), token.decimalPlaces))
                    setAmountTouched(true)
                  }
                }}
                onBlur={() => setAmountTouched(true)}
                size="sm"
                isDisabled={form.isSubmitting}
              >
                <NumberInputField />
                <NumberInputStepper h="1.90rem">
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              {!!meta.error && (
                <FormErrorMessage>{meta.error}</FormErrorMessage>
              )}
            </FormControl>
          )}
        </Field>
        <Field name={`votes[${props.voteIdx}].args.assets[${props.idx}].unit`}>
          {({ form, meta }: FieldProps) => (
            <FormControl isInvalid={meta.touched && !!meta.error}>
              <TokenSelectionButton
                initialValue={token}
                onSelect={(t: Token) => {
                  const unit = t.address.policyId + t.address.name
                  setUnit(unit === "" ? "lovelace" : unit)
                  setUnitTouched(true)
                  setToken(t)
                  setAmount(0)
                  setAmountStr("0")
                }}
                disabled={form.isSubmitting}
              />
              {!!meta.error && (
                <FormErrorMessage>{meta.error}</FormErrorMessage>
              )}
            </FormControl>
          )}
        </Field>
      </Grid>
    </>
  )
}

export const FUND_PAYOUT_DEFAULT_VALUES: FundPayoutArgs = {
  address: "",
  assets: [{ unit: "lovelace", quantity: 0 }],
}

const FundPayoutArgsInput = (props: { idx: number }) => {
  const [{ value: address }, , { setValue: setAddress }] = useField(
    `votes[${props.idx}].args.address`,
  )

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
      <Flex align="center" ml="8px" mb="8px">
        <Icon as={FaCoins} mr={2} />
        <Text>Assets</Text>
      </Flex>
      <Field name={`votes[${props.idx}].args.assets`}>
        {({ form, field }: FieldProps<Asset[]>) => (
          <>
            {field.value?.map((_, index) => (
              <Fragment key={props.idx + " " + index}>
                <Field name={`votes[${props.idx}].args.assets[${index}]`}>
                  {({ meta }: FieldProps) => (
                    <FormControl isInvalid={!!meta.error}>
                      <AssetSelection voteIdx={props.idx} idx={index} />
                      {!!meta.error && typeof meta.error === "string" && (
                        <FormErrorMessage textAlign="right">
                          {meta.error}
                        </FormErrorMessage>
                      )}
                    </FormControl>
                  )}
                </Field>
              </Fragment>
            ))}
            <Button
              mt="16px"
              onClick={() => {
                form.setFieldValue(
                  `votes[${props.idx}].args.assets[${field.value.length}]`,
                  { unit: "lovelace", quantity: 0 },
                )
              }}
              alignSelf="center"
            >
              Add Asset
            </Button>
          </>
        )}
      </Field>
    </>
  )
}

export default FundPayoutArgsInput
