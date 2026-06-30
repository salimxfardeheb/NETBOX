/**
 * Tiny classname joiner — concatenates truthy class fragments.
 * Avoids pulling in a dependency just for conditional classes.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
