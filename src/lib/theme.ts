/** Compute a WCAG-safe text color for a team primary so a yellow team never gets white text. */
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function onColor(primary: string): string {
  const L = luminance(primary);
  const white = 1.05 / (L + 0.05);
  const black = (L + 0.05) / 0.05;
  return white >= black ? "#FFFFFF" : "#1B1F24";
}
export function teamStyle(theme: { primary: string; accent: string }): React.CSSProperties {
  return { ["--team-primary" as string]: theme.primary, ["--team-on-primary" as string]: onColor(theme.primary), ["--team-accent" as string]: theme.accent };
}
