import type { ReactNode } from "react";

type PageHeadingProps = {
  eyebrow: ReactNode;
  title: ReactNode;
  description: ReactNode;
  className?: string;
};

export function PageHeading({
  eyebrow,
  title,
  description,
  className = "",
}: PageHeadingProps) {
  return (
    <header className={className}>
      <div className="mb-3 text-[10px] font-bold tracking-[1.7px] text-[var(--text-secondary,#789285)]">
        {eyebrow}
      </div>
      <h1 className="text-[clamp(24px,2.4vw,34px)] font-[550] tracking-[-1.2px] leading-[1.25] [&>span]:text-[var(--text-secondary,#67a67e)] min-[1500px]:text-[38px] max-[900px]:text-[26px] max-[720px]:text-[27px]">
        {title}
      </h1>
      <p className="mt-2.5 text-[11px] leading-[1.7] text-[var(--text-secondary,#64756a)]">
        {description}
      </p>
    </header>
  );
}
