import { crawlSite } from "@/lib/scanner/crawler";
import { runDetectors } from "@/lib/scanner/detectors";
import type { ScanResult } from "@/types/assessment";

export async function scanWebsite(url: string): Promise<ScanResult> {
  const { pages, pagesCap, depthCap } = await crawlSite(url);
  const detection = runDetectors(pages);

  return {
    targetUrl: url,
    scannedAt: new Date().toISOString(),
    pagesScanned: pages.length,
    pagesCap,
    depthCap,
    evidences: detection.evidences,
    pageUrls: pages.map((p) => p.url)
  };
}
