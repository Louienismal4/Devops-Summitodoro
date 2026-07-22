export const DEFAULT_MAP_STYLE_URL =
  "https://tiles.openfreemap.org/styles/liberty";

export const resolveMapStyleUrl = (configuredUrl?: string): string => {
  const candidate = configuredUrl?.trim();
  if (!candidate) return DEFAULT_MAP_STYLE_URL;

  try {
    const url = new URL(candidate);
    return url.protocol === "https:" ? url.toString() : DEFAULT_MAP_STYLE_URL;
  } catch {
    return DEFAULT_MAP_STYLE_URL;
  }
};

export const mapStyleUrl = resolveMapStyleUrl(
  process.env.NEXT_PUBLIC_MAP_STYLE_URL,
);
