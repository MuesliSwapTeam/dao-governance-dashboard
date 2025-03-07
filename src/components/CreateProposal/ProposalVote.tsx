import {
  Box,
  Flex,
  Heading,
  IconButton,
  Text,
  useColorModeValue,
} from "@chakra-ui/react"
import { CloseIcon } from "@chakra-ui/icons"
import ProposalVoteTypeSelection from "./ProposalVoteTypeSelection"
import ProposalTextInput from "./ProposalTextInput"
import { FaFileAlt } from "react-icons/fa"
import { Vote } from "../../api/model/tally"
import FundPayoutArgs from "./SpecialArgs/FundPayoutArgs"
import { Field, FieldProps, useField } from "formik"

const ProposalVote = (props: { idx: number }) => {
  const borderColor = useColorModeValue("gray.200", "gray.600")

  const [{ value: votes }, , { setValue: setVotes }] = useField<Vote[]>(`votes`)
  const [{ value: type }, ,] = useField(`votes[${props.idx}].type`)
  const [{ value: title }, , { setValue: setTitle }] = useField(
    `votes[${props.idx}].title`,
  )

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      borderColor={borderColor}
      p={4}
      marginTop="10px"
    >
      <Flex justify={"space-between"}>
        <Heading size="md">{props.idx + 1}</Heading>
        {type == "Reject" && (
          <>
            <Heading size="sm">Reject Proposal</Heading>
            <Box />
          </>
        )}
        {props.idx > 0 && (
          <IconButton
            aria-label="Close"
            icon={<CloseIcon />}
            variant="outline"
            onClick={() => setVotes(votes.filter((_, i) => props.idx !== i))}
            size="xs"
            isRound={true}
          />
        )}
      </Flex>
      {type != "Reject" ? (
        <>
          <ProposalVoteTypeSelection idx={props.idx} />
          <Field name={`votes[${props.idx}].title`}>
            {({ form, meta }: FieldProps) => (
              <ProposalTextInput
                icon={FaFileAlt}
                title={"Title"}
                value={title}
                setValue={setTitle}
                charLimit={50}
                disabled={form.isSubmitting}
                error={meta.touched && meta.error ? meta.error : undefined}
              />
            )}
          </Field>
          {type === "FundPayout" && <FundPayoutArgs idx={props.idx} />}
        </>
      ) : (
        <Text mt={2} textAlign="center">
          This is a required option, and will reject the proposal if voted for.
        </Text>
      )}
    </Box>
  )
}

export default ProposalVote
