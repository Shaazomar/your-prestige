import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface ProjectCardProps {
  href: string;
  title: string;
  location?: string | null;
  architect?: string | null;
  year?: string | null;
  image: string;
  blurDataURL?: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
}

/**
 * Large image; title always visible, credits reveal on hover.
 *
 * The reveal is progressive enhancement only — the metadata is in the DOM
 * and readable by screen readers at all times, and on touch (no hover) the
 * `group-focus-within` state and the always-on title carry it.
 */
export function ProjectCard({
  href,
  title,
  location,
  architect,
  year,
  image,
  blurDataURL,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 50vw",
  className,
}: ProjectCardProps) {
  const credits = [location, architect, year].filter(Boolean) as string[];

  return (
    <Link
      href={href}
      className={cn(
        "hover-zoom media-frame media-scrim group block aspect-[4/5] md:aspect-[3/2]",
        className
      )}
    >
      <Image
        src={image}
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        placeholder={blurDataURL ? "blur" : undefined}
        blurDataURL={blurDataURL}
        className="object-cover"
      />

      <div className="scrim-content absolute inset-x-0 bottom-0 p-7 md:p-9">
        <h3 className="text-h3 text-text">{title}</h3>

        {credits.length > 0 && (
          <div
            className={cn(
              "grid grid-rows-[0fr] opacity-0",
              "transition-[grid-template-rows,opacity] duration-600 ease-[cubic-bezier(0.22,1,0.36,1)]",
              "group-hover:grid-rows-[1fr] group-hover:opacity-100",
              "group-focus-within:grid-rows-[1fr] group-focus-within:opacity-100",
              /* No hover on touch — show it unconditionally there. */
              "[@media(hover:none)]:grid-rows-[1fr] [@media(hover:none)]:opacity-100"
            )}
          >
            <div className="overflow-hidden">
              <p className="mt-3 text-sm text-muted">{credits.join(" · ")}</p>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
