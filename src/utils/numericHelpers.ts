import Big from "big.js"

export function toNativeAmount(
  x: Big | string | number,
  decimals: number,
): string {
  if (!x) return "0"

  return Big(x.toString())
    .mul(10 ** decimals)
    .toFixed(0, Big.roundDown)
}

export function fromNativeAmount(
  x: bigint | string | Big | number,
  decimals: number,
): Big {
  if (!x) return Big("0")

  // Decimals hotfix, because some EPs mess up the field names
  return Big(x.toString()).div(10 ** (decimals ?? 0))
}

export enum NumberFormatVariants {
  STANDARD = "standard",
  COMPACT = "compact",
  SCIENTIFIC = "scientific",
}

export function formatNumber(
  x: Big | string | number,
  decimals: number,
  variant?: NumberFormatVariants,
  minDecimals?: number,
) {
  let formatOptions: Intl.NumberFormatOptions
  switch (variant) {
    case NumberFormatVariants.COMPACT:
      formatOptions = {
        minimumFractionDigits: minDecimals ?? 0,
        maximumFractionDigits: Math.min(Math.max(decimals, 0), 20),
        notation: "compact",
        compactDisplay: "short",
      }
      break
    case NumberFormatVariants.SCIENTIFIC:
      formatOptions = {
        notation: "scientific",
      }
      break
    case NumberFormatVariants.STANDARD:
    default:
      formatOptions = {
        minimumFractionDigits: minDecimals ?? 0,
        maximumFractionDigits: Math.min(Math.max(decimals, 0), 20),
      }
  }
  const numberFormat = Intl.NumberFormat(undefined, formatOptions)

  return numberFormat.format(
    Big(x).round(Math.max(decimals, 0), Big.roundHalfEven).toNumber(),
  )
}

export function formatNumberFixed(
  x: Big | string | number,
  decimals: number,
  variant?: NumberFormatVariants,
) {
  return formatNumber(x, decimals, variant, decimals)
}
