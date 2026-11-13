// A single line on any document, keyed by SKU (a product code)
export interface LineItem {
  sku: string;          // e.g. "TOM-CRATE"
  description: string;  // e.g. "Crate of tomatoes"
  quantity: number;     // ordered / received / billed
  unitPrice?: number;   // a GRN has no price, so it's optional
}

export interface PurchaseOrder {
  id: string;           // e.g. "PO-1001"
  vendor: string;
  createdAt: string;    // ISO timestamp
  lineItems: LineItem[]; // unitPrice = agreed price
}

export interface GoodsReceivedNote {
  id: string;           // e.g. "GRN-1001"
  poId: string;         // links back to the PO
  receivedAt: string;   // the immutable evidence moment
  lineItems: LineItem[]; // quantity = what actually arrived
}

export interface Invoice {
  id: string;           // e.g. "INV-1001"
  poId: string;         // links back to the PO
  createdAt: string;
  lineItems: LineItem[]; // unitPrice = what they're charging
}