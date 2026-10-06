import { X } from "lucide-react";
import { useEffect, useRef } from "react";
export function Modal({
  title,
  children,
  onClose,
  dismissDisabled = false,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  dismissDisabled?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    dialog?.querySelector("input")?.focus();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="[border:1px_solid_var(--border-strong,_#dde8dc)] rounded-[15px] p-7.5 bg-[var(--surface,_#fff)] text-[color:var(--ink)] shadow-[0_24px_80px_#17342225] w-130 max-w-[calc(100vw_-_40px)] max-h-[85vh] m-auto [&::backdrop]:bg-[#142c2466] [&::backdrop]:[backdrop-filter:blur(3px)] [&_input]:text-[13px] [&_label]:text-[11px]"
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        if (!dismissDisabled) onClose();
      }}
    >
      <div className="flex items-center justify-between gap-4 [&_h2]:text-[24px] [&_h2]:tracking-[-0.7px] [&_h2]:font-[550]">
        <h2>{title}</h2>
        <button
          className="text-[color:var(--text-secondary,_#99aa9e)]"
          type="button"
          aria-label="Close dialog"
          disabled={dismissDisabled}
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
