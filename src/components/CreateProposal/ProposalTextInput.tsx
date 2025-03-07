import {
  Box,
  Flex,
  Input,
  Text,
  Textarea,
  Icon,
  FormControl,
  FormHelperText,
  FormErrorMessage,
} from "@chakra-ui/react"
import { IconType } from "react-icons"
import { handleChangeClbk } from "./utils"

const ProposalTextInput = (props: {
  placeholder?: string
  icon: IconType
  title: string
  value: string
  setValue: (v: string) => void
  charLimit?: number
  disabled?: boolean
  error?: string
}) => {
  const InputComp = (props.charLimit ?? 0) >= 200 ? Textarea : Input
  const handleChange = handleChangeClbk(props.charLimit ?? null, props.setValue)

  return (
    <Box mb={4}>
      <Flex align="center" ml="8px" mb="8px">
        <Icon as={props.icon} mr={2} />
        <Text>{props.title}</Text>
      </Flex>
      <FormControl isInvalid={!!props.error}>
        <InputComp
          value={props.value}
          onChange={handleChange}
          placeholder={
            props.placeholder ?? `Enter the ${props.title.toLowerCase()}`
          }
          size="sm"
          isDisabled={props.disabled}
        />
        {!!props.error ? (
          <FormErrorMessage>{props.error}</FormErrorMessage>
        ) : (
          props.charLimit != null && (
            <FormHelperText>
              {props.charLimit - props.value.length} characters remaining
            </FormHelperText>
          )
        )}
      </FormControl>
    </Box>
  )
}

export default ProposalTextInput
