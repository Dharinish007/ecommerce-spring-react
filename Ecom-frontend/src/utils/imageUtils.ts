const PLACEHOLDER_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="none">
      <rect width="400" height="400" fill="#F1F5F9"/>
      <g opacity="0.4" transform="translate(140, 140)">
        <rect x="10" y="25" width="100" height="80" rx="12" stroke="#475569" stroke-width="6" fill="#E2E8F0"/>
        <path d="M35 25V15C35 8 45 3 60 3C75 3 85 8 85 15V25" stroke="#475569" stroke-width="6" stroke-linecap="round"/>
        <circle cx="60" cy="65" r="14" stroke="#475569" stroke-width="5"/>
        <path d="M60 56V74M51 65H69" stroke="#475569" stroke-width="5" stroke-linecap="round"/>
      </g>
      <text x="200" y="270" text-anchor="middle" fill="#64748B" font-family="system-ui, sans-serif" font-size="14" font-weight="600" letter-spacing="1">NO IMAGE AVAILABLE</text>
    </svg>
`);

export function resolveProductImageUrl(image?: string | null): string {
  if (!image || image.trim() === "" || image === "default.png") {
    return PLACEHOLDER_SVG;
  }

  // If already absolute URL
  if (image.startsWith("http://") || image.startsWith("https://") || image.startsWith("data:")) {
    return image;
  }

  // Fallback to backend /images/ route
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
  const backendBase = apiBase.replace(/\/api\/?$/, "");
  return `${backendBase}/images/${image}`;
}

export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event>
): void {
  const target = event.currentTarget;
  if (target.src !== PLACEHOLDER_SVG) {
    target.src = PLACEHOLDER_SVG;
  }
}
