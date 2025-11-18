import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface GiftSuggestionData {
  name: string;
  description: string;
  pax: number;
  pricePerBox: string;
  total: string;
  selectedProducts: Array<{ name: string; price?: number }>;
  variants: Array<{ name: string; productName: string }>;
  tierPricing?: Array<{ minQuantity: number; maxQuantity: number; pricePerUnit: number }>;
  specialInstructions?: string;
}

interface CompanyInfo {
  name: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  website_url?: string;
}

export const generateGiftSuggestionPDF = async (
  giftData: GiftSuggestionData,
  companyInfo?: CompanyInfo,
  formInputs?: {
    pax: string;
    pricePerPerson: string;
    dietaryRestriction: 'halal' | 'non-halal';
    specialInstructions: string;
  },
  currency: string = 'RM'
) => {
  try {
    console.log('Starting PDF generation with data:', { giftData, companyInfo, formInputs });

    // Use 'portrait' orientation for better mobile compatibility
    const doc = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10; // Consistent margin for mobile
    const contentWidth = pageWidth - (margin * 2);
    let currentY = 20;

    console.log('PDF document initialized, page dimensions:', { pageWidth, pageHeight, contentWidth });

    // Helper function to add company header with large spacing (simplified to avoid async issues)
    const addCompanyHeader = (): number => {
      let headerHeight = 60; // Large spacing as requested

      console.log('addCompanyHeader called, companyInfo:', companyInfo);

      // For now, use text-only header to avoid async logo loading issues
      // Header box with large spacing
      doc.setLineWidth(0.5);
      doc.rect(10, 10, pageWidth - 20, headerHeight);

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      const companyName = companyInfo?.name || 'Gift Suggestion Report';
      const textWidth = doc.getTextWidth(companyName);
      doc.text(companyName, (pageWidth - textWidth) / 2, 35);

      if (companyInfo?.address) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const addressWidth = doc.getTextWidth(companyInfo.address);
        doc.text(companyInfo.address, (pageWidth - addressWidth) / 2, 45);
      }

      if (companyInfo?.phone) {
        doc.setFontSize(10);
        const phoneWidth = doc.getTextWidth(companyInfo.phone);
        doc.text(companyInfo.phone, (pageWidth - phoneWidth) / 2, 52);
      }

      console.log('Header completed, returning Y:', headerHeight + 20);
      return headerHeight + 20; // Return Y position after header
    };

    // Add company header
    console.log('Adding company header...');
    currentY = addCompanyHeader();
    console.log('Company header added, currentY:', currentY);

    // Report title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const title = 'Gift Suggestion Report';
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (pageWidth - titleWidth) / 2, currentY + 10);

  currentY += 25;

  // Form inputs summary
  if (formInputs) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Request Details:', margin, currentY);

    currentY += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Number of People: ${formInputs.pax}`, margin, currentY);
    doc.text(`Budget per Person: ${currency} ${formInputs.pricePerPerson}`, margin, currentY + 6);
    doc.text(`Dietary Restriction: ${formInputs.dietaryRestriction === 'halal' ? 'Halal' : 'Non-Halal'}`, margin, currentY + 12);

    currentY += 25;
  }

  // Gift box summary
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Generated Gift Box:', margin, currentY);

  currentY += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Name: ${giftData.name}`, margin, currentY);
  doc.text(`Description: ${giftData.description}`, margin, currentY + 6);
  doc.text(`Quantity: ${giftData.pax} boxes`, margin, currentY + 12);
  doc.text(`Price per Box: ${currency} ${giftData.pricePerBox}`, margin, currentY + 18);
  doc.text(`Total Price: ${currency} ${giftData.total}`, margin, currentY + 24);

  currentY += 35;

  // Selected Products Table
  if (giftData.selectedProducts && giftData.selectedProducts.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Selected Products:', margin, currentY);
    currentY += 10;

    const productTableData = giftData.selectedProducts.map((product, index) => [
      index + 1,
      product.name,
      product.price ? `${currency} ${product.price.toFixed(2)}` : 'N/A'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Product Name', 'Price']],
      body: productTableData,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { fillColor: [102, 126, 234], textColor: 255 },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      columnStyles: {
        0: { cellWidth: 15 }, // Fixed width for index
        1: { cellWidth: contentWidth - 50 }, // Flexible width for product name
        2: { cellWidth: 35 } // Fixed width for price
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;
  }

  // Flavor Varieties Table
  if (giftData.variants && giftData.variants.length > 0) {
    // Check if we need a new page
    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Flavor Varieties (${giftData.variants.length} total):`, margin, currentY);
    currentY += 10;

    const variantTableData = giftData.variants.map((variant, index) => [
      index + 1,
      variant.name,
      variant.productName
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Flavor Name', 'Product']],
      body: variantTableData,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { fillColor: [102, 126, 234], textColor: 255 },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      columnStyles: {
        0: { cellWidth: 15 }, // Fixed width for index
        1: { cellWidth: (contentWidth - 15) * 0.6 }, // 60% for flavor name
        2: { cellWidth: (contentWidth - 15) * 0.4 } // 40% for product name
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;
  }

  // Tier Pricing Table (if available)
  if (giftData.tierPricing && giftData.tierPricing.length > 0) {
    // Check if we need a new page
    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Volume Pricing:', margin, currentY);
    currentY += 10;

    const tierTableData = giftData.tierPricing.map((tier) => [
      `${tier.minQuantity}${tier.maxQuantity === Infinity ? '+' : `-${tier.maxQuantity}`}`,
      `${currency} ${tier.pricePerUnit.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Quantity Range', 'Price per Box']],
      body: tierTableData,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { fillColor: [102, 126, 234], textColor: 255 },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      columnStyles: {
        0: { cellWidth: contentWidth * 0.6 }, // 60% for quantity range
        1: { cellWidth: contentWidth * 0.4 } // 40% for price
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;
  }

  // Special Instructions
  if (formInputs?.specialInstructions && formInputs.specialInstructions.trim()) {
    // Check if we need a new page
    if (currentY > pageHeight - 40) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Special Instructions:', margin, currentY);

    currentY += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    // Handle multi-line text with responsive width
    const splitText = doc.splitTextToSize(formInputs.specialInstructions, contentWidth);
    doc.text(splitText, margin, currentY);
    currentY += splitText.length * 5 + 10;
  }

  // Footer with generation date
  const footerY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  const generatedText = `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`;
  const footerWidth = doc.getTextWidth(generatedText);
  doc.text(generatedText, (pageWidth - footerWidth) / 2, footerY);

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Gift_Suggestion_${giftData.pax}pax_${timestamp}.pdf`;

    console.log('About to save PDF with filename:', filename);

    // Download the PDF
    doc.save(filename);

    console.log('PDF saved successfully');

  } catch (error) {
    console.error('Error in PDF generation:', error);
    throw new Error(`PDF generation failed: ${error.message}`);
  }
};