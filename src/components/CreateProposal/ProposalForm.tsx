import {
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react"
import { Formik, Field, Form } from "formik"
import * as Yup from "yup"
import ProposalTextInput from "./ProposalTextInput"
import ProposalVote from "./ProposalVote"
import {
  FaFileAlt,
  FaUser,
  FaPen,
  FaAlignLeft,
  FaBalanceScale,
} from "react-icons/fa"
import { createTally } from "../../cardano/gov_state/base"
import {
  getShortDescriptionPlaceholder,
  getDescriptionPlaceholder,
  getCleanProposalValues,
} from "./utils"
import { useLazyGetGovernanceStateQuery } from "../../api/governanceStateApi"
import { Asset, Vote } from "../../api/model/tally"
import useWalletContext from "../../context/wallet"
import { Fragment } from "react/jsx-runtime"
import { useMemo, useState } from "react"
import { useGetTreasuryFundsQuery } from "../../api/treasuryApi"
import { useNavigate } from "react-router-dom"
import { CheckCircleIcon } from "@chakra-ui/icons"
import ConnectButton from "../ConnectButton"

// Custom validation method
declare module "yup" {
  interface ArraySchema<
    TIn extends any[] | null | undefined,
    TContext,
    TDefault = undefined,
    TFlags extends Yup.Flags = "",
    T = any,
  > {
    uniqueValue(
      accessFn: (elem: T) => any,
      message: string,
      additionalPath?: string,
    ): this
  }
}

Yup.addMethod(Yup.array, "uniqueValue", function (accessFn, message) {
  return this.test("uniqueValue", message, function (list) {
    const { path, createError } = this
    if (list) {
      const set = new Set()
      for (let i = 0; i < list.length; i += 1) {
        const elem = accessFn(list[i])
        if (set.has(elem)) {
          return createError({ path: `${path}[${i}]`, message })
        }
        set.add(elem)
      }
    }
    return true
  })
})

const useValidationSchema = () => {
  const { data: treasuryAssets = [] } = useGetTreasuryFundsQuery()

  return useMemo(
    () =>
      Yup.object({
        title: Yup.string()
          .min(10, "Title must be at least 10 characters")
          .max(50, "Title must be 50 characters or less")
          .required("Required"),
        creator: Yup.string()
          .min(3, "Creator name must be at least 3 characters")
          .max(50, "Creator name must be 50 characters or less")
          .matches(
            /^[a-zA-Z0-9_ ]*$/,
            "Creator name can only contain letters, numbers, spaces, and underscores",
          )
          .required("Required"),
        shortDescription: Yup.string()
          .min(20, "Short description must be at least 20 characters")
          .max(200, "Short description must be 200 characters or less")
          .required("Required"),
        description: Yup.string()
          .min(100, "Description must be at least 100 characters")
          .max(2000, "Description must be 2000 characters or less")
          .required("Required"),
        votes: Yup.array().of(
          Yup.object({
            type: Yup.string()
              .oneOf(["Reject", "Opinion", "FundPayout"])
              .required("Required"),
            title: Yup.string()
              .min(6, "Vote title must be at least 6 characters")
              .max(50, "Vote title must be 50 character or less")
              .required("Required"),
            args: Yup.mixed()
              .when("type", {
                is: "Opinion",
                then: () => Yup.object().shape({}),
                // Yup.string().max(100, "Vote title must be 100 character or less"),
                otherwise: () =>
                  Yup.mixed().when("type", {
                    is: "FundPayout",
                    then: () =>
                      Yup.object().shape({
                        address: Yup.string().required("Required"),
                        assets: Yup.array()
                          .min(
                            1,
                            "At least one asset must be selected for FundPayout",
                          )
                          .of(
                            Yup.object({
                              quantity: Yup.number()
                                // TODO should shift this validation to the component. UX is annoying
                                // and need to validate that minAda on output treasury UTxO would be satisfied
                                .min(1, "Amount has to be higher than 0")
                                .test("max-value", function (value) {
                                  const { unit } = this.parent
                                  const maxValue = Number(
                                    treasuryAssets.find((t) => {
                                      if (unit === "lovelace") {
                                        return (
                                          t.policy_id === "" &&
                                          t.asset_name === ""
                                        )
                                      }
                                      return t.policy_id + t.asset_name === unit
                                    })?.amount ?? 0,
                                  )
                                  if (Number(value) >= maxValue) {
                                    return this.createError({
                                      message: `Quantity cannot exceed treasury balance of ${maxValue}.`,
                                    })
                                  }
                                  return true
                                })
                                .required("Required"),
                              unit: Yup.string().required("Required"),
                            }),
                          )
                          .uniqueValue(
                            (e: Asset) => e.unit,
                            "Tokens must be different",
                          ),
                      }),
                    otherwise: () =>
                      Yup.mixed().when("type", {
                        is: "Reject",
                        then: () => Yup.object().shape({}),
                        otherwise: () =>
                          Yup.object({
                            isIllegal: Yup.bool().required("Illegal use!"),
                          }), // Placeholder to cause reject
                      }),
                  }),
              })
              .required("Required"),
          }),
        ),
      }),
    [treasuryAssets],
  )
}

const ProposalForm = () => {
  const { isConnected } = useWalletContext()
  const detailBg = useColorModeValue("white", "gray.700")
  const textColor = useColorModeValue("gray.800", "white")
  const bgColor = useColorModeValue("gray.100", "gray.600")

  const validationSchema = useValidationSchema()
  const [fetch, { isFetching }] = useLazyGetGovernanceStateQuery()

  const navigate = useNavigate()
  const { isOpen, onClose, onOpen } = useDisclosure()

  const [txHash, setTxHash] = useState("")
  const handleSubmit = async (values: any) => {
    if (!isFetching) {
      const result = await fetch()
      console.log("result", result)
      if (result.data && result.data.length) {
        const cleanValues = getCleanProposalValues(
          values.title,
          values.creator,
          "",
          values.description,
          values.shortDescription,
          values.votes,
        )

        const govData = result.data[0]
        console.log("creating tally")
        const hash = await createTally(
          govData.transaction_hash,
          govData.output_index,
          [
            { unit: "lovelace", quantity: 3004110 },
            {
              unit: govData.gov_nft.policy_id + govData.gov_nft.asset_name,
              quantity: 1,
            },
          ],
          govData.min_quorum.toString(),
          govData.min_winning_threshold,
          govData.min_proposal_duration.toString(),
          govData.latest_applied_proposal_id.toString(),
          govData.last_proposal_id.toString(),
          (
            Number(Date.now()) +
            2 * govData.min_proposal_duration +
            12e4
          ).toString(),
          JSON.stringify(cleanValues, null, 2),
          values.votes,
        )
        console.log("hash", hash)
        // Open the success dialog, if a tx hash is present
        if (hash) {
          setTxHash(hash)
          onOpen()
        }
      }
    }
  }

  return (
    <Flex
      flexDir={"column"}
      bg={detailBg}
      p={8}
      borderRadius="lg"
      boxShadow="xl"
      rowGap={"1em"}
    >
      <Box bg={bgColor} p={4} borderRadius="md">
        <b>Voting Guide</b>
        <ol style={{ marginLeft: "22px", marginTop: "5px" }}>
          <li>
            Each proposal will have a single winning outcome, determined by the
            highest number of votes.
          </li>
          <li>
            For the winning outcome to be valid, it must meet the quorum
            threshold.
          </li>
          <li>Each proposal is open for voting for exactly 1 day.</li>
        </ol>
      </Box>

      <Heading mb={4} color={textColor}>
        New Proposal
      </Heading>

      <Formik
        initialValues={{
          title: "",
          creator: "",
          shortDescription: "",
          description: "",
          votes: [
            {
              type: "Reject",
              title: "Reject",
              description: "This option will reject the proposal.",
              args: {},
            },
          ] as Vote[],
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        validateOnChange={true}
        validateOnBlur={true}
      >
        {({ values, errors, touched, ...rest }) => (
          <Form>
            <Field name="title">
              {({ field, form }: any) => (
                <ProposalTextInput
                  icon={FaFileAlt}
                  title="Proposal Title"
                  value={values.title}
                  setValue={field.onChange(field.name)}
                  charLimit={50}
                  disabled={form.isSubmitting}
                  error={
                    touched.title && errors.title ? errors.title : undefined
                  }
                />
              )}
            </Field>

            <Field name="creator">
              {({ field, form }: any) => (
                <ProposalTextInput
                  icon={FaUser}
                  title="Creator Name"
                  value={values.creator}
                  setValue={field.onChange(field.name)}
                  charLimit={50}
                  disabled={form.isSubmitting}
                  error={
                    touched.creator && errors.creator
                      ? errors.creator
                      : undefined
                  }
                />
              )}
            </Field>

            <Field name="shortDescription">
              {({ field, form }: any) => (
                <ProposalTextInput
                  icon={FaPen}
                  title="Short Description"
                  value={values.shortDescription}
                  setValue={field.onChange(field.name)}
                  placeholder={getShortDescriptionPlaceholder()}
                  charLimit={200}
                  disabled={form.isSubmitting}
                  error={
                    touched.shortDescription && errors.shortDescription
                      ? errors.shortDescription
                      : undefined
                  }
                />
              )}
            </Field>

            <Field name="description">
              {({ field, form }: any) => (
                <ProposalTextInput
                  icon={FaAlignLeft}
                  title="Description"
                  value={values.description}
                  setValue={field.onChange(field.name)}
                  placeholder={getDescriptionPlaceholder()}
                  charLimit={2000}
                  disabled={form.isSubmitting}
                  error={
                    touched.description && errors.description
                      ? errors.description
                      : undefined
                  }
                />
              )}
            </Field>

            <Box>
              <Flex align="center" ml="8px">
                <Icon as={FaBalanceScale} mr={2} />
                <Text>Vote Outcomes</Text>
              </Flex>
              {values.votes.map((_, index) => (
                <Fragment key={index}>
                  <ProposalVote idx={index} />
                </Fragment>
              ))}
              <Button
                mt="16px"
                onClick={() => {
                  rest.setFieldValue(`votes[${values.votes.length}]`, {
                    type: "Opinion",
                    title: "",
                    description: "",
                    args: {},
                  })
                }}
                alignSelf="center"
              >
                Add Outcome
              </Button>
            </Box>

            <Flex mt="16px">
              <Box flexGrow="1" />
              {!isConnected ? (
                <ConnectButton longName />
              ) : (
                <Button
                  type="submit"
                  bgGradient="linear(to-r, teal.500, green.500)"
                  color="white"
                  _hover={{ bgGradient: "linear(to-r, teal.600, green.600)" }}
                  isDisabled={
                    isFetching || values.votes.length <= 0 || !isConnected
                  }
                  // onClick={() => {
                  //   if (Object.keys(errors).length > 0) {
                  //     console.log('Errors preventing submission:', errors);
                  //   }
                  // }}
                >
                  {isFetching ? "Loading..." : "Submit"}
                </Button>
              )}
            </Flex>
          </Form>
        )}
      </Formik>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Box display="flex" alignItems="center">
              <CheckCircleIcon color="green.500" boxSize={6} mr={2} />
              Proposal Created Successfully
            </Box>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody w="100%" pb={4}>
            <Text mb={4}>
              Your new proposal has been successfully created and is being
              processed on the blockchain. This process may take a few moments
              to complete.
            </Text>
            <Text mb={4}>
              You can track the your proposal on CardanoScan or check back on
              the "All Proposals" page shortly. Please allow up to a minute for
              the proposal to fully appear.
            </Text>
            <Text color="gray.500" fontSize="sm" mb={4}>
              Once your proposal is fully confirmed, it will be visible to all
              users and available for voting or further actions.
            </Text>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={() => {
                /* TODO pjordan: Make this configurable */
                const url = `https://preprod.cardanoscan.io/transaction/${txHash}`
                window.open(url, "_blank")
              }}
            >
              View on Cardanoscan
            </Button>
            <Button variant="outline" onClick={() => navigate("/proposals")}>
              Go to All Proposals
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  )
}

export default ProposalForm
