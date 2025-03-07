import {
  extendTheme,
  ThemeConfig,
  ThemeComponents,
  StyleFunctionProps,
} from "@chakra-ui/react"

import colors from "./colors"

const components: ThemeComponents = {
  Heading: {
    baseStyle: {
      fontFamily: "Gilroy",
    },
  },
  Button: {
    baseStyle: {},
    variants: {
      base: ({ colorMode, theme: { colors } }: StyleFunctionProps) => ({
        background:
          colorMode === "light" ? colors.accent.light : colors.accent.dark,
        color: "#FFFFFF",
      }),
      ghost: {
        background: "transparent",
        _hover: {
          background: "transparent",
          fontWeight: 700,
          border: "none",
          color: "#5346ff",
        },
      },
    },
    defaultProps: {
      // Then here we set the base variant as the default
      variant: "base",
    },
  },
}

const config: ThemeConfig = {
  initialColorMode: "system",
  useSystemColorMode: true,
}

const theme = extendTheme({ config, colors, components })

export default theme
