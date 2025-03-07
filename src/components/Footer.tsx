import {
  Box,
  Container,
  Stack,
  Text,
  Link,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react"
import { FaXTwitter, FaGithub, FaDiscord } from "react-icons/fa6"

const Footer: React.FC = () => {
  return (
    <Box
      as="footer"
      bg={useColorModeValue("gray.100", "gray.900")}
      color={useColorModeValue("gray.600", "gray.200")}
    >
      <Box
        borderTopWidth={1}
        borderStyle={"solid"}
        borderColor={useColorModeValue("gray.200", "gray.700")}
      >
        <Container
          as={Stack}
          maxW={"6xl"}
          py={4}
          direction={{ base: "column", md: "row" }}
          spacing={4}
          justify={{ base: "center", md: "space-between" }}
          align={{ base: "center", md: "center" }}
        >
          <Text>© {new Date().getFullYear()} Muesliswap</Text>
          <Stack direction={"row"} spacing={6}>
            <Link
              /* TODO: Add this */
              href={"https://discord.com/invite/...."}
              title="Discord"
              isExternal
            >
              <Icon as={FaDiscord} />
            </Link>
            <Link
              href={"https://github.com/MuesliswapTeam"}
              title="Official Github"
              isExternal
            >
              <Icon as={FaGithub} />
            </Link>
            <Link
              href={"https://x.com/MuesliSwapTeam"}
              title="Official X"
              isExternal
            >
              <Icon as={FaXTwitter} />
            </Link>
          </Stack>
        </Container>
      </Box>
    </Box>
  )
}

export default Footer
