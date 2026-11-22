export const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

export const buttonStyles = {
  primary: "bg-crimson-600 text-white shadow-lg shadow-crimson-600/20 hover:bg-crimson-700",
  outline: "border border-navy-200 bg-white text-navy-800 hover:border-navy-400",
  danger: "border border-crimson-200 bg-white text-crimson-700 hover:bg-crimson-50",
  ghost: "text-navy-700 hover:bg-navy-50",
} as const;

export const buttonSizes = {
  sm: "px-3.5 py-2 text-sm",
  md: "px-5 py-3 text-[15px]",
} as const;

export function buttonClass(
  variant: keyof typeof buttonStyles = "primary",
  size: keyof typeof buttonSizes = "md",
) {
  return `${buttonBase} ${buttonStyles[variant]} ${buttonSizes[size]}`;
}