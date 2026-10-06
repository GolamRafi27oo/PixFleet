import type { ButtonHTMLAttributes } from "react";
export function NavigationButton(
  props: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">,
) {
  return (
    <button
      type="button"
      className="flex items-center gap-[11px] w-full text-left rounded-[7px] py-[13px] px-[13px] text-[12px] text-[color:var(--text-secondary,_#7d8c82)] mb-1.5 [&[aria-current=page]]:bg-[var(--surface-accent,_#dfece2)] [&[aria-current=page]]:text-[color:var(--text-secondary,_#27694e)] [&[aria-current=page]]:font-[650] [&:hover]:bg-[var(--surface-soft,_#e5eee7)] max-[900px]:text-[0px] max-[900px]:gap-0 max-[900px]:w-11.5 max-[900px]:h-11.5 max-[900px]:justify-center max-[900px]:p-3"
      {...props}
    />
  );
}
