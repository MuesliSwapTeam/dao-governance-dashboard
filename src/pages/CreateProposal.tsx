import { Flex, Button } from "@chakra-ui/react"
import { IoArrowBack } from "react-icons/io5"
import { Link } from "react-router-dom"
import ProposalForm from "../components/CreateProposal/ProposalForm"
import { useColorModeValue } from "@chakra-ui/react"

const CreateProposalPage = () => {
  const buttonBg = useColorModeValue("accent.light", "accent.dark")
  const buttonHoverBg = useColorModeValue(
    "accentPressed.light",
    "accentPressed.dark",
  )
  return (
    <Flex
      flexDir="column"
      m="24px 16px"
      sx={{ textAlign: "start" }}
      rowGap={"1em"}
    >
      <Link to={`/proposals`}>
        <Button
          leftIcon={<IoArrowBack />}
          bg={buttonBg}
          _hover={{ bg: buttonHoverBg }}
          color="white"
        >
          Proposals
        </Button>
      </Link>
      <ProposalForm />
    </Flex>
  )
}

export default CreateProposalPage
