import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  compact?: boolean;
};

export function Button({
  variant = "primary",
  compact = false,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const appearance =
    variant === "primary"
      ? "bg-[var(--green)] text-[var(--on-accent,#fff)] shadow-[0_2px_3px_#184d2112] enabled:hover:bg-[var(--green-dark)] enabled:hover:shadow-[0_3px_8px_#184d2128]"
      : "bg-[var(--surface,#fff)] border border-[var(--border-strong,#dfe6e1)] text-[var(--text-secondary,#456752)] hover:bg-[var(--surface-soft,#f4f8f5)]";
  const size = compact
    ? "min-h-[33px] px-3 text-[10px]"
    : "min-h-[39px] px-[19px] text-[11px]";
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-md py-0 font-[550] transition-colors ${appearance} ${size} ${className}`}
      {...props}
    />
  );
}
