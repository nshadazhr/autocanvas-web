/**
 * Tiny classname combiner — falsy values are dropped, everything else is
 * joined with a space. Deliberately not pulling in `clsx`/`tailwind-merge`
 * for something this small; add one of those for real if class conflicts
 * (e.g. two different `px-*` utilities landing on the same element) start
 * showing up in practice.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
