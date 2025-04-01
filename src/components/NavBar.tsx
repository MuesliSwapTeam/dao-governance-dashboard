import {
  Flex,
  Button,
  useColorMode,
  IconButton,
  useColorModeValue,
  Box,
  Image,
  Spacer,
} from "@chakra-ui/react"
import { MoonIcon, SunIcon } from "@chakra-ui/icons"
import { useNavigate } from "react-router-dom"
import ConnectButton from "./ConnectButton"

import lightLogo from "../assets/logo-light.svg"
import darkLogo from "../assets/logo-dark.svg"

export const HEADER_PADDING = "8px 16px"

const NavBar: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode()
  const bg = useColorModeValue("primary.light", "primary.dark")
  const navigate = useNavigate()
  const isWide = false

  return (
    <Flex
      as="nav" // uses nav style in App.css
      align="center"
      fontFamily="Gilroy, sans-serif"
      fontWeight="500"
      p={HEADER_PADDING}
      justifyContent={isWide ? "space-between" : "end"}
      bg={bg}
      boxShadow={"md"}
      border={"sm"}
      sx={{
        transition: "200ms",
        borderRadius: "16px",
        // TODO: box shadow
        zIndex: 5,
      }}
    >
      {/* Logo */}
      <Box
        p="2"
        aria-label="Go to Home"
        onClick={() => navigate("/")}
        cursor="pointer"
      >
        <Image
          src={colorMode === "dark" ? darkLogo : lightLogo}
          alt="Logo"
          boxSize="48px"
        />
      </Box>

      <Spacer />

      <Button variant="ghost" onClick={() => navigate("/proposals")}>
        Proposals
      </Button>
      <Button variant="ghost" onClick={() => navigate("/treasury")}>
        Treasury
      </Button>
      <Button variant="ghost" onClick={() => navigate("/stake")}>
        My Stake
      </Button>
      {/*
      Remove matchmaker link for testnet
      <Button variant="ghost" onClick={() => navigate("/matchmakers")}>
        Matchmakers
    </Button>*/}

      {/* Wallet Connect Button */}
      <ConnectButton />

      {/* Dark/Light Mode Switch */}
      <IconButton
        aria-label="Toggle dark mode"
        icon={colorMode === "dark" ? <SunIcon /> : <MoonIcon />}
        onClick={toggleColorMode}
      />
    </Flex>
  )
}

export default NavBar
