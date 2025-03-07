import React, { useMemo } from "react"
import { Pie } from "react-chartjs-2"
import { Box, Heading, Flex, useColorMode, useTheme } from "@chakra-ui/react"
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  CategoryScale,
  LinearScale,
} from "chart.js"
import { TreasuryAsset } from "../../api/model/treasury"
import { fromNativeAmount } from "../../utils/numericHelpers"

const COLOR_PALLETE = ["#6a9ae2", "#d773d5", "#e29d30", "#e25354", "#5e5bd7"]
const HOVER_COLOR_PALLETE = [
  "#5b82c4",
  "#bb61b9",
  "#c67f26",
  "#c64445",
  "#4b45b7",
]

ChartJS.register(ArcElement, Tooltip, Legend, Title, CategoryScale, LinearScale)

const PieChart: React.FC<{ assets: TreasuryAsset[] }> = ({ assets }) => {
  const { colors } = useTheme()
  const { colorMode } = useColorMode()

  const bgColor =
    colorMode === "dark"
      ? colors.backgroundSecondary.dark
      : colors.backgroundSecondary.light
  const bgSnColor =
    colorMode === "dark" ? colors.background.dark : colors.background.light
  const textColor = colorMode === "dark" ? colors.text.dark : colors.text.light
  const textSubtleColor =
    colorMode === "dark" ? colors.text.dark : colors.text.light

  const data = useMemo(() => {
    if (!assets) {
      return {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: [],
            hoverBackgroundColor: [],
          },
        ],
      }
    }

    const labels = assets.map((v) => v.symbol)
    const data = assets.map((v) =>
      fromNativeAmount(v.eqAmountLvl, 6).toNumber(),
    )
    const bgColors = COLOR_PALLETE.slice(0, assets.length)
    const hoverBgColors = HOVER_COLOR_PALLETE.slice(0, assets.length)

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: bgColors,
          hoverBackgroundColor: hoverBgColors,
        },
      ],
    }
  }, [assets])

  const options = {
    plugins: {
      legend: {
        position: "right" as "right" | "left" | "center",
        labels: {
          font: {
            size: 15,
            weight: 500,
          },
          color: textSubtleColor,
          padding: 25,
          usePointStyle: true,
          boxWidth: 12,
        },
      },
      tooltip: {
        callbacks: {
          label: ({
            formattedValue,
          }: {
            label: string
            formattedValue: string
          }) => ` ${formattedValue} ADA`,
        },
        backgroundColor: bgSnColor,
        titleFont: {
          size: 16,
          weight: 500,
        },
        bodyFont: {
          size: 14,
        },
        bodySpacing: 10,
        padding: 10,
        cornerRadius: 8,
      },
    },
    cutout: "65%",
    layout: {
      padding: 0,
    },
  }

  return (
    <Flex
      width="100%"
      p={6}
      borderRadius="md"
      boxShadow="lg"
      direction="column"
      alignItems="center"
      bg={bgColor}
    >
      <Box width="100%" mb={4}>
        <Heading as="h3" size="md" color={textColor}>
          Asset Distribution
        </Heading>
      </Box>
      <Box width="75%" mt="-20px">
        <Pie data={data} options={options} />
      </Box>
    </Flex>
  )
}

export default PieChart
