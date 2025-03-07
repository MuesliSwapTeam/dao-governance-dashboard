import React, { useMemo } from "react"
import { Line } from "react-chartjs-2"
import { Box, Heading, Flex, useColorMode, useTheme } from "@chakra-ui/react"
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Title,
  CategoryScale,
  LinearScale,
  Filler,
} from "chart.js"
import { fromNativeAmount } from "../../utils/numericHelpers"
import { TreasuryChartItem } from "../../api/model/treasury"

ChartJS.register(
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Title,
  CategoryScale,
  LinearScale,
  Filler,
)

const LineChart: React.FC<{
  assetHistory: TreasuryChartItem[]
}> = ({ assetHistory }) => {
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
    if (!assetHistory) {
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

    // TODO pjordan: Normalize these in some way
    const labels = assetHistory.map((v) => v.timestamp)
    const data = assetHistory.map((v) =>
      fromNativeAmount(
        v.funds.find((p) => p.asset_name === "" && p.policy_id === "")
          ?.amount ?? 0,
        6,
      ).toNumber(),
    )

    return {
      labels,
      datasets: [
        {
          label: "Total value locked in fund",
          data,
          // backgroundColor: bgColors,
          // hoverBackgroundColor: hoverBgColors,
          borderColor: "#6a9ae2",
          backgroundColor: "rgba(106, 154, 226, 0.2)",
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: "#6a9ae2",
          pointBorderColor: "#fff",
          pointHoverRadius: 6,
          pointHoverBackgroundColor: "#ff6384",
          pointHoverBorderColor: "#fff",
        },
      ],
    }
  }, [assetHistory])

  // const data = {
  //   labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
  //   datasets: [
  //     {
  //       label: "Total value locked in fund",
  //       data: [10, 30, 50, 40, 70, 60, 30, 10, 40],
  //       borderColor: "#6a9ae2",
  //       backgroundColor: "rgba(106, 154, 226, 0.2)",
  //       fill: true,
  //       tension: 0.4,
  //       pointRadius: 4,
  //       pointBackgroundColor: "#6a9ae2",
  //       pointBorderColor: "#fff",
  //       pointHoverRadius: 6,
  //       pointHoverBackgroundColor: "#ff6384",
  //       pointHoverBorderColor: "#fff",
  //     },
  //   ],
  // }

  const options = {
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: bgSnColor,
        titleFont: {
          size: 14,
          weight: 500,
        },
        bodyFont: {
          size: 12,
        },
        bodySpacing: 6,
        padding: 10,
        cornerRadius: 4,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: textSubtleColor,
          font: {
            size: 12,
          },
        },
        min: 0, // Ensure x-axis starts at 0
      },
      y: {
        grid: {
          color: textSubtleColor,
        },
        ticks: {
          color: textSubtleColor,
          font: {
            size: 12,
          },
          beginAtZero: true, // Ensure y-axis starts at 0
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  }

  return (
    <Flex
      width="100%"
      p={6}
      borderRadius="md"
      boxShadow="md"
      direction="column"
      alignItems="center"
      bg={bgColor}
    >
      <Flex width="100%" justifyContent="left" alignItems="left" mb={4}>
        <Heading as="h3" ml="10px" size="md" color={textColor} textAlign="left">
          Treasury Value Over Time
        </Heading>
      </Flex>
      <Box width="100%" height="350px">
        <Line data={data} options={options} />
      </Box>
    </Flex>
  )
}

export default LineChart
