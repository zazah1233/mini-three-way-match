import type { PurchaseOrder, GoodsReceivedNote, Invoice } from "./types";

export type Tier = "OK" | "REVIEW" | "FLAGGED";

export interface LineVariance {
  sku: string;
  quantityVariance: number; // 0.111 means +11.1%
  priceVariance: number;    // 0.10 means +10%
  tier: Tier;               // worst tier for THIS line
  notes: string[];          // human-readable flags
}

export interface MatchResult {
  poId: string;
  status: Tier;             // worst tier overall
  lines: LineVariance[];
}

const OK_THRESHOLD = 0.02;
const REVIEW_THRESHOLD = 0.05;

export function tierFor(variance: number): Tier {
  const v = Math.abs(variance);
  if (v <= OK_THRESHOLD) return "OK";
  if (v <= REVIEW_THRESHOLD) return "REVIEW";
  return "FLAGGED";
}

function worst(a: Tier, b: Tier): Tier {
  const rank = { OK: 0, REVIEW: 1, FLAGGED: 2 };
  return rank[a] >= rank[b] ? a : b;
}

export function reconcile(
  po: PurchaseOrder,
  grn: GoodsReceivedNote,
  invoice: Invoice
): MatchResult {
  const lines: LineVariance[] = [];
  let status: Tier = "OK";

  for (const invLine of invoice.lineItems) {
    const poLine = po.lineItems.find((l) => l.sku === invLine.sku);
    const grnLine = grn.lineItems.find((l) => l.sku === invLine.sku);
    const notes: string[] = [];

    // Phantom line: billed but never received
    if (!grnLine) {
      lines.push({
        sku: invLine.sku,
        quantityVariance: Infinity,
        priceVariance: 0,
        tier: "FLAGGED",
        notes: ["Phantom item: billed but never received (no GRN line)"],
      });
      status = "FLAGGED";
      continue;
    }

    const quantityVariance =
      (invLine.quantity - grnLine.quantity) / grnLine.quantity;

    const poPrice = poLine?.unitPrice ?? invLine.unitPrice ?? 0;
    const priceVariance =
      poPrice === 0 ? 0 : ((invLine.unitPrice ?? 0) - poPrice) / poPrice;

    if (!poLine) notes.push("Billed item not found on the original PO");
    if (quantityVariance > 0) notes.push("Billed for more units than were received");
    if (priceVariance > 0) notes.push("Billed at a higher price than agreed on the PO");

    const lineTier = worst(tierFor(quantityVariance), tierFor(priceVariance));
    status = worst(status, lineTier);

    lines.push({ sku: invLine.sku, quantityVariance, priceVariance, tier: lineTier, notes });
  }

  return { poId: po.id, status, lines };
}