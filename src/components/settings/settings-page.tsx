import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/page-heading";
import type { WorkspaceState } from "@/hooks/use-workspace";
import { APP_VERSION } from "@/lib/app-info";

export function SettingsPage({
  updateState,
  latestVersion,
  checkForUpdates,
}: Pick<WorkspaceState, "updateState" | "latestVersion" | "checkForUpdates">) {
  return (
    <section className="w-full max-w-[none] ">
      <PageHeading
        eyebrow={<> PIXfleet PREFERENCES </>}
        title={<> Settings </>}
        description={
          <> Appearance, updates, and ways to help improve PixFleet. </>
        }
        className="my-[35px]"
      />
      <div className="flex flex-wrap items-center justify-between gap-6 p-5.5 mb-3.5 [border:1px_solid_var(--border)] rounded-[12px] bg-[var(--surface,_#fff)] [&_h2]:text-[14px] [&_h2]:font-[650]">
        <div className="min-w-0">
          <h2>Appearance</h2>
          <p className="mt-[7px] text-[color:var(--text-secondary,_#64756a)] text-[11px] leading-[1.6]">
            Choose how PixFleet looks. System follows your device.
          </p>
        </div>
        <ThemeToggle />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-6 p-5.5 mb-3.5 [border:1px_solid_var(--border)] rounded-[12px] bg-[var(--surface,_#fff)] [&_h2]:text-[14px] [&_h2]:font-[650]">
        <div className="min-w-0">
          <h2>Updates</h2>
          <p className="mt-[7px] text-[color:var(--text-secondary,_#64756a)] text-[11px] leading-[1.6]">
            {updateState === "available"
              ? `Version ${latestVersion} is available on GitHub.`
              : updateState === "up-to-date"
                ? "You are running the latest version."
                : updateState === "no-release"
                  ? `No GitHub releases have been published yet. Running v${APP_VERSION}.`
                  : updateState === "error"
                    ? `Could not check GitHub releases right now. Running v${APP_VERSION}.`
                    : "Check GitHub for the latest PixFleet release."}
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={checkForUpdates}
          disabled={updateState === "checking"}
        >
          {updateState === "checking" ? "Checking…" : "Check for updates"}
        </Button>
      </div>
    </section>
  );
}
