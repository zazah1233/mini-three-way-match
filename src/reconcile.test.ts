import { describe, it, expect } from "vitest";
import { reconcile } from "./reconcile";
import type { PurchaseOrder, GoodsReceivedNote, Invoice } from "./types";

// Helper: builds a PO, GRN and Invoice for one SKU, so each test stays short
function makeDocs(opts: {
  poQty?: number;
  poPrice?: number;
  grnQty?: number;
  invQty?: number;
  invPrice?: number;
} = {}): [PurchaseOrder, GoodsReceivedNote, Invoice] {
  const { poQty = 100, poPrice = 500, grnQty = 100, invQty = 100, invPrice = 500 } = opts;
  const item = { sku: "TOM-CRATE", description: "Crate of tomatoes" };

  const po: PurchaseOrder = {
    id: "PO-1",
    vendor: "Fresh Farms Ltd",
    createdAt: "2026-11-10T09:00:00Z",
    lineItems: [{ ...item, quantity: poQty, unitPrice: poPrice }],
  };
  const grn: GoodsReceivedNote = {
    id: "GRN-1",
    poId: "PO-1",
    receivedAt: "2026-11-11T08:30:00Z",
    lineItems: [{ ...item, quantity: grnQty }],
  };
  const invoice: Invoice = {
    id: "INV-1",
    poId: "PO-1",
    createdAt: "2026-11-12T10:00:00Z",
    lineItems: [{ ...item, quantity: invQty, unitPrice: invPrice }],
  };
  return [po, grn, invoice];
}

describe("reconcile", () => {
  it("returns OK when PO, GRN and Invoice all agree", () => {
    const [po, grn, invoice] = makeDocs();
    const result = reconcile(po, grn, invoice);
    expect(result.status).toBe("OK");
  });

  it("flags a price overcharge", () => {
    // Billed 550 vs agreed 500 = +10%
    const [po, grn, invoice] = makeDocs({ invPrice: 550 });
    const result = reconcile(po, grn, invoice);
    expect(result.status).toBe("FLAGGED");
    // toBeCloseTo because floating-point math is not exact
    expect(result.lines[0].priceVariance).toBeCloseTo(0.1);
  });

  it("flags a short delivery with a full bill", () => {
    // Received 90, billed 100, price correct
    const [po, grn, invoice] = makeDocs({ grnQty: 90 });
    const result = reconcile(po, grn, invoice);
    expect(result.status).toBe("FLAGGED");
    expect(result.lines[0].quantityVariance).toBeCloseTo(0.111, 3);
  });

  it("passes a tiny 1% price difference", () => {
    // Billed 505 vs agreed 500 = +1%
    const [po, grn, invoice] = makeDocs({ invPrice: 505 });
    const result = reconcile(po, grn, invoice);
    expect(result.status).toBe("OK");
  });
    it("flags a phantom item billed but never received", () => {
    const [po, grn, invoice] = makeDocs();
    // Add a SKU to the invoice that has no GRN line
    invoice.lineItems.push({
      sku: "RICE-BAG",
      description: "Bag of rice",
      quantity: 10,
      unitPrice: 800,
    });
    const result = reconcile(po, grn, invoice);
    expect(result.status).toBe("FLAGGED");
    const phantom = result.lines.find((l) => l.sku === "RICE-BAG");
    expect(phantom?.notes.join(" ")).toContain("Phantom item");
  });
});