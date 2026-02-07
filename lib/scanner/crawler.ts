import { DEPTH_CAP, PAGES_CAP } from "@/lib/scanner/constants";
import { extractLinks, fetchHtml, isLikelyHtml, normalizeUrl, scoreLinkPriority } from "@/lib/scanner/utils";
import type { CrawlPage } from "@/types/assessment";

interface QueueNode {
  url: string;
  depth: number;
}

export async function crawlSite(target: string): Promise<{
  pages: CrawlPage[];
  pagesCap: number;
  depthCap: number;
}> {
  const start = normalizeUrl(target);
  const queue: QueueNode[] = [{ url: start.toString(), depth: 0 }];
  const visited = new Set<string>();
  const pages: CrawlPage[] = [];

  while (queue.length > 0 && pages.length < PAGES_CAP) {
    queue.sort((a, b) => scoreLinkPriority(new URL(b.url)) - scoreLinkPriority(new URL(a.url)));
    const current = queue.shift();
    if (!current) break;

    if (visited.has(current.url)) continue;
    visited.add(current.url);

    const currentUrl = new URL(current.url);
    if (currentUrl.hostname !== start.hostname) continue;
    if (!isLikelyHtml(currentUrl.pathname)) continue;

    try {
      const result = await fetchHtml(current.url);
      if (!result.ok || !result.html) continue;

      pages.push({
        url: current.url,
        html: result.html,
        status: result.status,
        headers: result.headers,
        depth: current.depth
      });

      if (current.depth >= DEPTH_CAP) continue;

      const links = extractLinks(currentUrl, result.html)
        .map((href) => {
          try {
            const parsed = new URL(href);
            parsed.hash = "";
            return parsed.toString();
          } catch {
            return "";
          }
        })
        .filter(Boolean)
        .filter((href) => new URL(href).hostname === start.hostname);

      for (const href of links) {
        if (!visited.has(href)) {
          queue.push({ url: href, depth: current.depth + 1 });
        }
      }
    } catch {
      continue;
    }
  }

  return {
    pages,
    pagesCap: PAGES_CAP,
    depthCap: DEPTH_CAP
  };
}
