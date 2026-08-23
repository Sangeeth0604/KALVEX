import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { InvoiceData, InvoiceBuilderResult } from "./types";

export async function generateInvoicePdf(
  invoice: InvoiceData
): Promise<InvoiceBuilderResult> {
  const startTime = performance.now();
  const pdfDoc = await PDFDocument.create();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;

  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  // Header Banner
  page.drawRectangle({
    x: margin,
    y: pageHeight - margin - 50,
    width: contentWidth,
    height: 50,
    color: rgb(0.08, 0.12, 0.18),
  });

  page.drawText("INVOICE", {
    x: margin + 16,
    y: pageHeight - margin - 32,
    size: 20,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(`# ${invoice.invoiceNumber || "INV-001"}`, {
    x: pageWidth - margin - 150,
    y: pageHeight - margin - 30,
    size: 13,
    font: fontBold,
    color: rgb(0.2, 0.75, 0.6),
  });

  let currentY = pageHeight - margin - 75;

  // Seller and Client Columns
  // Column 1: Seller
  page.drawText("FROM:", {
    x: margin,
    y: currentY,
    size: 9,
    font: fontBold,
    color: rgb(0.5, 0.55, 0.6),
  });
  page.drawText(invoice.sellerName || "Your Company", {
    x: margin,
    y: currentY - 14,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.2),
  });
  page.drawText(invoice.sellerAddress || "", {
    x: margin,
    y: currentY - 26,
    size: 9,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.4),
  });
  page.drawText(invoice.sellerEmail || "", {
    x: margin,
    y: currentY - 38,
    size: 9,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.4),
  });

  // Column 2: Client
  const clientX = margin + 260;
  page.drawText("BILL TO:", {
    x: clientX,
    y: currentY,
    size: 9,
    font: fontBold,
    color: rgb(0.5, 0.55, 0.6),
  });
  page.drawText(invoice.clientName || "Client Name", {
    x: clientX,
    y: currentY - 14,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.2),
  });
  page.drawText(invoice.clientAddress || "", {
    x: clientX,
    y: currentY - 26,
    size: 9,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.4),
  });
  page.drawText(invoice.clientEmail || "", {
    x: clientX,
    y: currentY - 38,
    size: 9,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.4),
  });

  currentY -= 65;

  // Dates bar
  page.drawRectangle({
    x: margin,
    y: currentY - 20,
    width: contentWidth,
    height: 24,
    color: rgb(0.96, 0.97, 0.98),
  });

  page.drawText(`Date: ${invoice.date || new Date().toLocaleDateString()}`, {
    x: margin + 12,
    y: currentY - 13,
    size: 9,
    font: fontRegular,
    color: rgb(0.2, 0.25, 0.3),
  });
  page.drawText(`Due Date: ${invoice.dueDate || "Upon Receipt"}`, {
    x: margin + 180,
    y: currentY - 13,
    size: 9,
    font: fontRegular,
    color: rgb(0.2, 0.25, 0.3),
  });
  page.drawText(`Currency: ${invoice.currency || "USD ($)"}`, {
    x: margin + 360,
    y: currentY - 13,
    size: 9,
    font: fontRegular,
    color: rgb(0.2, 0.25, 0.3),
  });

  currentY -= 45;

  // Items Table Header
  page.drawRectangle({
    x: margin,
    y: currentY - 18,
    width: contentWidth,
    height: 22,
    color: rgb(0.12, 0.16, 0.24),
  });

  page.drawText("ITEM DESCRIPTION", {
    x: margin + 12,
    y: currentY - 12,
    size: 8,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  page.drawText("QTY", {
    x: margin + 280,
    y: currentY - 12,
    size: 8,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  page.drawText("UNIT PRICE", {
    x: margin + 340,
    y: currentY - 12,
    size: 8,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  page.drawText("TOTAL", {
    x: margin + 420,
    y: currentY - 12,
    size: 8,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  currentY -= 22;

  let subtotal = 0;

  // Render Table Rows
  invoice.items.forEach((item, index) => {
    const lineTotal = item.quantity * item.unitPrice;
    subtotal += lineTotal;

    const rowY = currentY - 18;
    const isAlt = index % 2 === 1;

    if (isAlt) {
      page.drawRectangle({
        x: margin,
        y: rowY,
        width: contentWidth,
        height: 20,
        color: rgb(0.98, 0.98, 0.99),
      });
    }

    page.drawLine({
      start: { x: margin, y: rowY },
      end: { x: margin + contentWidth, y: rowY },
      thickness: 0.5,
      color: rgb(0.9, 0.92, 0.94),
    });

    page.drawText(item.description || `Item ${index + 1}`, {
      x: margin + 12,
      y: rowY + 6,
      size: 9,
      font: fontRegular,
      color: rgb(0.1, 0.15, 0.2),
    });
    page.drawText(item.quantity.toString(), {
      x: margin + 280,
      y: rowY + 6,
      size: 9,
      font: fontRegular,
      color: rgb(0.1, 0.15, 0.2),
    });
    page.drawText(item.unitPrice.toFixed(2), {
      x: margin + 340,
      y: rowY + 6,
      size: 9,
      font: fontRegular,
      color: rgb(0.1, 0.15, 0.2),
    });
    page.drawText(lineTotal.toFixed(2), {
      x: margin + 420,
      y: rowY + 6,
      size: 9,
      font: fontBold,
      color: rgb(0.1, 0.15, 0.2),
    });

    currentY -= 20;
  });

  // Calculate Totals
  const discountAmount = (subtotal * (invoice.discountPercent || 0)) / 100;
  const taxable = subtotal - discountAmount;
  const taxAmount = (taxable * (invoice.taxRatePercent || 0)) / 100;
  const grandTotal = taxable + taxAmount;

  currentY -= 20;

  // Summary Card on right
  const summaryX = margin + 280;
  const summaryWidth = contentWidth - 280;

  page.drawText("Subtotal:", { x: summaryX, y: currentY, size: 9, font: fontRegular, color: rgb(0.4, 0.45, 0.5) });
  page.drawText(`${subtotal.toFixed(2)}`, { x: margin + 420, y: currentY, size: 9, font: fontRegular, color: rgb(0.1, 0.15, 0.2) });
  currentY -= 16;

  if (invoice.discountPercent > 0) {
    page.drawText(`Discount (${invoice.discountPercent}%):`, { x: summaryX, y: currentY, size: 9, font: fontRegular, color: rgb(0.4, 0.45, 0.5) });
    page.drawText(`-${discountAmount.toFixed(2)}`, { x: margin + 420, y: currentY, size: 9, font: fontRegular, color: rgb(0.8, 0.2, 0.2) });
    currentY -= 16;
  }

  if (invoice.taxRatePercent > 0) {
    page.drawText(`Tax (${invoice.taxRatePercent}%):`, { x: summaryX, y: currentY, size: 9, font: fontRegular, color: rgb(0.4, 0.45, 0.5) });
    page.drawText(`+${taxAmount.toFixed(2)}`, { x: margin + 420, y: currentY, size: 9, font: fontRegular, color: rgb(0.1, 0.15, 0.2) });
    currentY -= 16;
  }

  page.drawRectangle({
    x: summaryX - 8,
    y: currentY - 20,
    width: summaryWidth + 8,
    height: 26,
    color: rgb(0.08, 0.12, 0.18),
  });

  page.drawText("TOTAL DUE:", { x: summaryX, y: currentY - 13, size: 10, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText(`${grandTotal.toFixed(2)}`, { x: margin + 420, y: currentY - 13, size: 11, font: fontBold, color: rgb(0.2, 0.75, 0.6) });

  // Notes & Footer
  if (invoice.notes) {
    page.drawText("NOTES / PAYMENT TERMS:", {
      x: margin,
      y: margin + 40,
      size: 8,
      font: fontBold,
      color: rgb(0.5, 0.55, 0.6),
    });
    page.drawText(invoice.notes, {
      x: margin,
      y: margin + 26,
      size: 8,
      font: fontRegular,
      color: rgb(0.3, 0.35, 0.4),
    });
  }

  const pdfBytes = await pdfDoc.save();
  const outputBlob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
  const outputName = `Invoice-${invoice.invoiceNumber || "INV-001"}.pdf`;
  const durationMs = Math.max(1, Math.round(performance.now() - startTime));

  return {
    fileName: outputName,
    outputSize: outputBlob.size,
    outputName,
    outputBlob,
    invoiceNumber: invoice.invoiceNumber,
    totalAmount: grandTotal,
    durationMs,
  };
}
