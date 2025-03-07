import {
  Flex,
  Icon,
  RadioGroup,
  Radio,
  Stack,
  Text,
  FormErrorMessage,
} from "@chakra-ui/react"
import {
  FaVoteYea,
  FaThumbsUp,
  // FaGavel,
  FaDollarSign,
  // FaTools,
} from "react-icons/fa"
import { Field, useField } from "formik"
import { useCallback } from "react"
import { FUND_PAYOUT_DEFAULT_VALUES } from "./SpecialArgs/FundPayoutArgs"

const ProposalVoteTypeSelection = (props: { idx: number }) => {
  const [{ value: type }, , { setValue: setType }] = useField(
    `votes[${props.idx}].type`,
  )
  const [, , { setValue: setArgs }] = useField(`votes[${props.idx}].args`)
  const updateType = useCallback((v: string) => {
    setType(v)
    setArgs(v === "FundPayout" ? FUND_PAYOUT_DEFAULT_VALUES : {})
  }, [])

  return (
    <Field name={`votes[${props.idx}].type`}>
      {({ form, meta }: any) => (
        <>
          <Flex justify="space-between" mb="1em" mt="1em" ml="8px">
            <Flex align="center">
              <Icon as={FaVoteYea} mr={2} />
              <Text>Vote Type</Text>
            </Flex>
            <RadioGroup
              onChange={updateType}
              value={type}
              isDisabled={form.isSubmitting}
            >
              <Stack direction="row" spacing={4}>
                <Radio value="Opinion" colorScheme="teal">
                  <Flex align="center">
                    <Icon as={FaThumbsUp} mr={2} />
                    <Text>Opinion</Text>
                  </Flex>
                </Radio>
                {/*           <Radio value="GovStateUpdate" colorScheme="blue">
            <Flex align="center">
              <Icon as={FaGavel} mr={2} />
              <Text>GovStateUpdate</Text>
            </Flex>
          </Radio> */}
                <Radio value="FundPayout" colorScheme="green">
                  <Flex align="center">
                    <Icon as={FaDollarSign} mr={2} />
                    <Text>FundPayout</Text>
                  </Flex>
                </Radio>
                {/*           <Radio value="PoolUpgrade" colorScheme="purple">
            <Flex align="center">
              <Icon as={FaTools} mr={2} />
              <Text>PoolUpgrade</Text>
            </Flex>
          </Radio> */}
              </Stack>
            </RadioGroup>
          </Flex>
          {!!meta.error && <FormErrorMessage>{meta.error}</FormErrorMessage>}
        </>
      )}
    </Field>
  )
}

export default ProposalVoteTypeSelection
