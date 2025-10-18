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
  console.log("proposal", proposal)
  // Find the vote with type "LicenseRelease"
  const licenseVote = proposal.votes.find(
    (vote) => vote.type === "LicenseRelease",
  )

  if (!licenseVote) {
    throw new Error("No vote with type 'LicenseRelease' found")
  }

  // Try to extract address from vote args
  let address = "TO BE ADDED"
  let datum = null
  let maximumFutureValidity = 0

  try {
    const licenseArgs = licenseVote.args as any
    if (licenseArgs && licenseArgs.fields && licenseArgs.fields.length >= 3) {
      // TODO pjordan: Properly transform binary to cbor
      address =
        licenseArgs.fields[0]?.fields?.[0]?.fields?.[0]?.bytes || "TO BE ADDED"
      datum = licenseArgs.fields[1]
      maximumFutureValidity = licenseArgs.fields[2]?.int || 0
    } else if (licenseArgs && licenseArgs[0]) {
      // Alternative structure
      address = licenseArgs[0]?.fields?.[0]?.fields?.[0]?.bytes || "TO BE ADDED"
      datum = licenseArgs[1]
      maximumFutureValidity = licenseArgs[2]?.int || 0
    }
  } catch (error) {
    console.warn("Could not parse license args, using defaults:", error)
  }

  const approveWeight = licenseVote.weight
  const revokeWeight = proposal.votes[0]?.weight || 0 // Assuming the first vote is for revocation
  const proposalEndDate = +new Date(proposal.endDate)
  const licenseEndDate = Date.now() + maximumFutureValidity
  const endDate = Math.min(proposalEndDate, licenseEndDate)

  // Get the ID of the "LicenseRelease" vote
  const voteIndex = proposal.votes.findIndex(
    (vote) => vote.type === "LicenseRelease",
  )

  return {
    licenseArgs: {
      address,
      datum,
      maximumFutureValidity,
      approveWeight,
      revokeWeight,
      endDate,
    },
    licenseReleaseVoteId: voteIndex,
  }
}
