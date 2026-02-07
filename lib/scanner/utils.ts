import { PRIORITY_PATH_HINTS, REQUEST_TIMEOUT_MS, SKIP_EXTENSIONS } from "@/lib/scanner/constants";

export function normalizeUrl(input: string): URL {
  const url = input.startsWith("http") ? input : `https://${input}`;
  return new URL(url);
}

export function isLikelyHtml(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  return !SKIP_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function extractLinks(baseUrl: URL, html: string): string[] {
  const regex = /href=["']([^"'#]+)["']/gi;
  const links = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    try {
      const absolute = new URL(match[1], baseUrl);
      links.add(absolute.toString());
    } catch {
      continue;
    }
  }

  return Array.from(links);
}

export function scoreLinkPriority(url: URL): number {
  const path = `${url.pathname}${url.search}`.toLowerCase();
  return PRIORITY_PATH_HINTS.reduce((acc, hint) => (path.includes(hint) ? acc + 1 : acc), 0);
}

export async function fetchHtml(url: string): Promise<{
  ok: boolean;
  status: number;
  html: string;
  headers: Record<string, string>;
}> {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent": "Maru-POPIA-Scanner/0.1"
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });

  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  const contentType = headers["content-type"] || "";
  if (!contentType.includes("text/html")) {
    return { ok: false, status: response.status, html: "", headers };
  }

  const html = await response.text();
  return { ok: response.ok, status: response.status, html, headers };
}

export function stripHtml(input: string): string {
  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function snippetAround(text: string, keywords: string[]): string {
  const lower = text.toLowerCase();
  const index = keywords
    .map((k) => lower.indexOf(k.toLowerCase()))
    .find((i) => i >= 0);

  if (index === undefined || index < 0) {
    return text.slice(0, 220);
  }

  const start = Math.max(0, index - 80);
  const end = Math.min(text.length, index + 140);
  return text.slice(start, end);
}
