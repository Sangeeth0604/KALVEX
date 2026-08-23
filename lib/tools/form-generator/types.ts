export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  currency: string;
  sellerName: string;
  sellerAddress: string;
  sellerEmail: string;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  items: InvoiceItem[];
  taxRatePercent: number;
  discountPercent: number;
  notes: string;
}

export interface InvoiceBuilderResult {
  fileName: string;
  outputSize: number;
  outputName: string;
  outputBlob: Blob;
  invoiceNumber: string;
  totalAmount: number;
  durationMs: number;
  busDocumentId?: string;
}
