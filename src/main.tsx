import React from "react"
import ReactDOM from "react-dom/client"
import { ChakraProvider } from "@chakra-ui/react"

import App from "./App.tsx"
import "./index.css"
import { ToastContainer } from "./components/ToastContainer.ts"
import Fonts from "./theme/Fonts.tsx"
import Background from "./theme/Background.tsx"
import theme from "./theme"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <Background />
      <Fonts />
      <ToastContainer />
      <App />
    </ChakraProvider>
  </React.StrictMode>,
)
