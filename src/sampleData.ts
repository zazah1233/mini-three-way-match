import type { PurchaseOrder, GoodsReceivedNote, Invoice } from "./types";

export const tomatoPO: PurchaseOrder = {
  id: "PO-1001",
  vendor: "Fresh Farms Ltd",
  createdAt: "2026-11-10T09:00:00Z",
  lineItems: [
    { sku: "TOM-CRATE", description: "Crate of tomatoes", quantity: 100, unitPrice: 500 },
  ],
};

export const tomatoGRN: GoodsReceivedNote = {
  id: "GRN-1001",
  poId: "PO-1001",
  receivedAt: "2026-11-11T08:30:00Z",
  lineItems: [
    { sku: "TOM-CRATE", description: "Crate of tomatoes", quantity: 90 },
  ],
};

export const tomatoInvoice: Invoice = {
  id: "INV-1001",
  poId: "PO-1001",
  createdAt: "2026-11-12T10:00:00Z",
  lineItems: [
    { sku: "TOM-CRATE", description: "Crate of tomatoes", quantity: 100, unitPrice: 550 },
  ],
};