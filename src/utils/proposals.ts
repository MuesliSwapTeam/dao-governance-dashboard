import { Proposal } from "../api/model/tally"

export const isLicenseReleaseProposal = (p: Proposal) => {
  const correctVoteTypes =
    p.voteTypes.length === 2 &&
    p.voteTypes[0] === null &&
    p.voteTypes[1] === "LicenseRelease"
  const hasArgs =
    p.votes.length === 2 && (p.votes[1].args as any)?.fields?.length === 3

  return correctVoteTypes && hasArgs
}

export const parseLicenseReleaseArgs = (proposal: Proposal) => {
  const licenseArgs = proposal.votes[1].args as any // VoteArgsMap["LicenseArgs"]
  // TODO pjordan: Properly transform binary to cbor
  const address = licenseArgs.fields[0].fields[0].fields[0].bytes
  const datum = licenseArgs.fields[1]
  const maximumFutureValidity = licenseArgs.fields[2].int

  const approveWeight = proposal.votes[1].weight
  const revokeWeight = proposal.votes[0].weight
  const proposalEndDate = +new Date(proposal.endDate)
  const licenseEndDate = Date.now() + maximumFutureValidity
  const endDate = Math.min(proposalEndDate, licenseEndDate)

  return {
    address,
    datum,
    maximumFutureValidity,
    approveWeight,
    revokeWeight,
    endDate,
  }
}
