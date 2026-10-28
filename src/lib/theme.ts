import { useTheme } from "next-themes";

/** Dark is the default and the baseline look; only an explicit "light" choice switches the palette. */
export function useIsLight() {
  const { theme } = useTheme();
  return theme === "light";
}
