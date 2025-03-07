import { Box, Text, Heading } from "@chakra-ui/react"

const MobileNotSupportedPage = () => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      textAlign="center"
      padding="20px"
    >
      <Heading as="h1" size="xl" mb={4} fontWeight="bold">
        Mobile Support Not Available
      </Heading>
      <Text fontSize="lg" mb={6}>
        We're sorry, but this app is currently not supported on mobile devices.
        Please visit us using a desktop browser for the best experience.
      </Text>
    </Box>
  )
}

export default MobileNotSupportedPage
