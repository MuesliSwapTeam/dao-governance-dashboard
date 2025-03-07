import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Heading,
  Text,
} from "@chakra-ui/react"

import ConnectButton from "./ConnectButton"

function ConnectCard() {
  return (
    <Card>
      <CardHeader>
        <Heading as="h1" size="lg">
          Wallet not Connected
        </Heading>
      </CardHeader>
      <CardBody>
        <Text>
          To review your open and pending orders, <br /> you will have to
          connect your wallet first.
        </Text>
        <Text>Click the button below to do so:</Text>
      </CardBody>
      <CardFooter justify="center">
        <ConnectButton />
      </CardFooter>
    </Card>
  )
}

export default ConnectCard
