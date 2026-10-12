import { ShieldCheck } from "lucide-react";

export function GuidePage() {
  return (
    <div className="max-w-195 [&_article_>_span]:text-[13px] [&_article_>_span]:text-[color:var(--text-secondary,_#91b899)] [&_article_>_span]:tracking-[1px] [&_h2]:text-[19px] [&_h2]:font-[550] [&_h2]:mb-3">
      <article className="flex gap-[25px] py-6.5 px-0 [border-bottom:1px_solid_var(--border)] max-[720px]:gap-4">
        <span>01</span>
        <div>
          <h2>Bring your images</h2>
          <p className="text-[12px] text-[color:var(--text-secondary,_#7c9083)] leading-[1.9]">
            Choose files, add a folder (including subfolders), or drag images
            into the desktop window. JPEG, PNG, static WebP, static SVG and
            HEIC/HEIF photos are supported. Each image can be up to 100 MB and
            40 megapixels, with up to 500 images in a batch.
          </p>
        </div>
      </article>
      <article className="flex gap-[25px] py-6.5 px-0 [border-bottom:1px_solid_var(--border)] max-[720px]:gap-4">
        <span>02</span>
        <div>
          <h2>Make it fit your project</h2>
          <p className="text-[12px] text-[color:var(--text-secondary,_#7c9083)] leading-[1.9]">
            Pick a preset, choose WebP, AVIF, PNG, JPEG or HEIC, and adjust
            quality and widths. Images keep their proportions. Enable Allow
            upscaling to enlarge smaller images; this may make them look softer.
            AVIF takes longer to encode; WebP is a good everyday choice. PNG is
            lossless; JPEG puts transparent areas on white. HEIC files are for
            compatible photo apps.
          </p>
        </div>
      </article>
      <article className="flex gap-[25px] py-6.5 px-0 [border-bottom:1px_solid_var(--border)] max-[720px]:gap-4">
        <span>03</span>
        <div>
          <h2>Export your images.</h2>
          <p className="text-[12px] text-[color:var(--text-secondary,_#7c9083)] leading-[1.9]">
            Choose a destination. PixFleet creates a new folder containing your
            images organized by format. Only image files are exported.
          </p>
        </div>
      </article>
      <div className="flex gap-4 bg-[var(--surface-accent,_#ecf3e9)] p-[25px] rounded-[10px] mt-7.5 text-[color:var(--text-secondary,_#72997e)] [&_svg]:shrink-0 [&_h3]:mb-2.5 [&_p_+_p]:mt-3">
        <ShieldCheck size={24} />
        <div>
          <h3>A few useful details</h3>
          <p className="text-[12px] text-[color:var(--text-secondary,_#7c9083)] leading-[1.9]">
            Originals stay untouched. Re-encoding removes source metadata and
            applies photo orientation. Exports may be larger when you generate
            multiple sizes. Use sRGB originals for predictable colors;
            wide-gamut profiles are not preserved. Animation, RAW and AVIF
            inputs are not supported in this version. Static SVGs use their
            canvas size and installed fonts; convert text to paths for
            consistent results. Linked or embedded images, scripts and HTML
            content in SVGs are not supported.
          </p>
          <p className="text-[12px] text-[color:var(--text-secondary,_#7c9083)] leading-[1.9]">
            Cancel safely between outputs. An active encoder finishes before
            cancellation; incomplete batch files are then removed.
          </p>
        </div>
      </div>
    </div>
  );
}
