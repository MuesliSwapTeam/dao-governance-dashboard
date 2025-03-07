import React, { ReactElement } from "react"
import { Proposal, VoteResult } from "../api/model/tally"
import VotesBarChart from "./VotesBarChart"

interface ProposalBarChartProps {
  proposal: Proposal
  height?: string
  colors?: string[]
  bgColor?: string
  showQuorum?: boolean
  hideQuorumText?: boolean
  titleFn?: (v: VoteResult, i: number) => string | ReactElement
}

const ProposalBarChart: React.FC<ProposalBarChartProps> = ({
  proposal,
  colors,
  showQuorum,
  ...props
}) => {
  return (
    <VotesBarChart
      votes={proposal.votes.map((v, i) => ({
        weight: v.weight,
        title: props.titleFn?.(v, i) ?? "",
        color: colors?.at(i % colors.length),
      }))}
      bgColor={props.bgColor}
      quorum={showQuorum ? proposal.quorum : undefined}
      {...props}
    />
  )
}

export default ProposalBarChart
