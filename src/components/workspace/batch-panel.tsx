import {
  Code2,
  FolderOpen,
  Monitor,
  Plus,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/page-heading";

import type { WorkspaceState } from "@/hooks/use-workspace";
import { AssetList } from "./asset-list";
import { Benefit } from "./benefit";
import { EmptyBatch } from "./empty-batch";
import { ExportProgress } from "./export-progress";
export function BatchPanel({
  assets,
  busy,
  importImages,
  dragging,
  selected,
  setSelected,
  remove,
  toggleSelected,
  issues,
  setIssues,
  cancelling,
  progress,
  setCancelling,
}: Pick<
  WorkspaceState,
  | "assets"
  | "busy"
  | "importImages"
  | "dragging"
  | "selected"
  | "setSelected"
  | "remove"
  | "toggleSelected"
  | "issues"
  | "setIssues"
  | "cancelling"
  | "progress"
  | "setCancelling"
>) {
  return (
    <section className="[padding:39px_34px_20px] min-w-0 overflow-y-auto min-[1500px]:p-12.5 max-[1120px]:[padding:30px_23px_20px] max-[900px]:pl-5 max-[900px]:pr-5 max-[720px]:shrink-0 max-[720px]:overflow-visible max-[720px]:py-7.5 max-[720px]:px-5">
      <PageHeading
        eyebrow={<> LESS PREP. MORE CREATING. </>}
        title={
          <>
            {" "}
            Good things come in batches<span>.</span>{" "}
          </>
        }
        description={
          <> From a folder of images to a website-ready collection. </>
        }
      />
      <div className="flex items-center justify-between max-[520px]:flex-wrap [margin:39px_0_17px] gap-2.5 [&_h2]:text-[13px] [&_h2]:font-semibold [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2 [&_h2]:whitespace-nowrap [&_h2_>_span]:grid [&_h2_>_span]:place-items-center [&_h2_>_span]:min-w-[21px] [&_h2_>_span]:h-5 [&_h2_>_span]:[border:1px_solid_var(--border)] [&_h2_>_span]:rounded-[5px] [&_h2_>_span]:text-[10px] [&_h2_>_span]:text-[color:var(--text-secondary,_#8c9790)] [&_h2_>_span]:bg-[var(--surface,_#fff)] max-[720px]:mt-7">
        <h2>
          Your images <span>{assets.length}</span>
        </h2>
        <div className="flex items-center gap-[17px] max-[900px]:gap-2.5">
          <button
            type="button"
            className="inline-flex items-center gap-[7px] py-[3px] px-0 text-[10px] text-[color:var(--text-secondary,_#687d71)] [&:hover]:text-[color:var(--green)]"
            disabled={!!busy}
            onClick={() => importImages(true)}
          >
            <FolderOpen size={16} /> Add folder
          </button>
          <Button
            type="button"
            variant="secondary"
            compact
            disabled={!!busy}
            onClick={() => importImages(false)}
          >
            <Plus size={16} /> Add images
          </Button>
        </div>
      </div>

      {assets.length === 0 ? (
        <EmptyBatch
          dragging={dragging}
          busy={busy}
          importImages={importImages}
        />
      ) : (
        <AssetList
          dragging={dragging}
          selected={selected}
          assets={assets}
          setSelected={setSelected}
          busy={busy}
          remove={remove}
          toggleSelected={toggleSelected}
          importImages={importImages}
        />
      )}

      {issues.length > 0 && (
        <div
          className="bg-[var(--warning-surface,_#fff8ef)] [border:1px_solid_var(--border-strong,_#ebd6b6)] text-[color:var(--warning-text,_#946b37)] rounded-[7px] p-3.5 mt-4 text-[10px]"
          role="alert"
        >
          <div className="flex justify-between items-center">
            <strong>A few things need attention</strong>
            <button
              type="button"
              aria-label="Dismiss errors"
              onClick={() => setIssues([])}
            >
              <X size={16} />
            </button>
          </div>
          <ul className="pl-4.5 max-h-37.5 overflow-auto leading-[1.8] mb-0">
            {issues.map((issue, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: Immutable error snapshots may contain repeated messages.
              <li key={i}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {busy === "export" && (
        <ExportProgress
          cancelling={cancelling}
          progress={progress}
          selected={selected}
          setCancelling={setCancelling}
          setIssues={setIssues}
        />
      )}

      <div className="flex items-center gap-3.5 [margin:30px_0_23px] text-[10px] tracking-[1.6px] text-[color:var(--text-secondary,_#a6afa8)]">
        <span className="h-[1px] bg-[var(--border)] flex-1" />A LITTLE LESS
        BUSYWORK
        <span className="h-[1px] bg-[var(--border)] flex-1" />
      </div>
      <div className="grid grid-cols-[repeat(3,_1fr)] gap-4 max-[900px]:gap-2">
        <Benefit
          icon={<Zap size={19} />}
          title="Lighter. Faster."
          text="Modern formats that keep your site moving."
        />
        <Benefit
          icon={<Monitor size={19} />}
          title="Every screen, covered."
          text="Responsive sizes, in one tidy export."
        />
        <Benefit
          icon={<Code2 size={19} />}
          title="Ready to ship."
          text="Clean filenames, organized by format."
        />
      </div>
      <div className="[border-top:1px_solid_var(--border)] flex gap-[7px] items-center text-[10px] text-[color:var(--text-secondary,_#64756a)] mt-[29px] pt-[19px] [&_svg]:text-[color:var(--text-secondary,_#8fab93)] [&_svg]:shrink-0">
        <ShieldCheck size={15} />
        <span>Originals stay untouched. Location metadata gets removed.</span>
        <span className="ml-auto text-[10px] text-[color:var(--text-secondary,_#acb3ad)] max-[1120px]:hidden">
          Made for your workflow
        </span>
      </div>
    </section>
  );
}
