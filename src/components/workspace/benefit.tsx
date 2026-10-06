export function Benefit({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article className="py-0.5 px-1 [&_h3]:text-[10px] [&_h3]:font-semibold [&_h3]:mb-[7px] min-[1500px]:[&_h3]:text-[12px] max-[900px]:[&_h3]:text-[10px] max-[720px]:[&_h3]:text-[10px]">
      <span className="grid place-items-center w-8.5 h-8.5 [border:1px_solid_var(--border-strong,_#e5ece7)] bg-[var(--surface,_#fff)] rounded-[9px] text-[color:var(--text-secondary,_#698978)] mb-3">
        {icon}
      </span>
      <h3>{title}</h3>
      <p className="text-[10px] text-[color:var(--text-secondary,_#64756a)] leading-[1.8] max-w-[145px] min-[1500px]:max-w-45 min-[1500px]:text-[11px] max-[900px]:text-[10px] max-[720px]:text-[10px]">
        {text}
      </p>
    </article>
  );
}
