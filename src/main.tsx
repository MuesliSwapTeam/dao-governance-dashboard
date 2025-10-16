import React from "react"
import ReactDOM from "react-dom/client"
import { ChakraProvider } from "@chakra-ui/react"

import App from "./App.tsx"
import "./index.css"
import { ToastContainer } from "./components/ToastContainer.ts"
import Fonts from "./theme/Fonts.tsx"
import Background from "./theme/Background.tsx"
import theme from "./theme"
import { Provider } from "react-redux"
import { store } from "./store"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <Provider store={store}>
        <Background />
        <Fonts />
        <ToastContainer />
        <App />
      </Provider>
    </ChakraProvider>
  </React.StrictMode>,
)
