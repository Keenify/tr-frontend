import jsPDF from 'jspdf';
import { B2BOrderRow } from '../types/B2BOrderTypes';

export const generateB2BOrderPDF = (rows: B2BOrderRow[]) => {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(20);
  doc.text('B2B Order', 20, 20);

  // Add date
  doc.setFontSize(10);
  const currentDate = new Date().toLocaleDateString();
  doc.text(`Date: ${currentDate}`, 20, 30);

  // Add table headers
  let yPosition = 50;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Pax', 20, yPosition);
  doc.text('Amount per Person', 60, yPosition);
  doc.text('Dietary Restriction', 120, yPosition);

  // Add table data
  doc.setFont(undefined, 'normal');
  yPosition += 10;

  rows.forEach((row) => {
    doc.text(row.pax.toString(), 20, yPosition);
    doc.text(`$${row.amountPerPerson.toFixed(2)}`, 60, yPosition);

    const dietary = row.dietaryRestriction === 'custom'
      ? row.customDietary || 'Custom'
      : row.dietaryRestriction.charAt(0).toUpperCase() + row.dietaryRestriction.slice(1);
    doc.text(dietary, 120, yPosition);

    yPosition += 8;
  });

  // Add totals
  yPosition += 10;
  doc.setFont(undefined, 'bold');
  const totalPax = rows.reduce((sum, row) => sum + row.pax, 0);
  const totalAmount = rows.reduce((sum, row) => sum + (row.pax * row.amountPerPerson), 0);

  doc.text(`Total Pax: ${totalPax}`, 20, yPosition);
  doc.text(`Total Amount: $${totalAmount.toFixed(2)}`, 20, yPosition + 8);

  // Generate filename with date
  const now = new Date();
  const formattedDate = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${now.getFullYear()}_${now.getHours()
    .toString()
    .padStart(2, '0')}-${now.getMinutes()
    .toString()
    .padStart(2, '0')}`;

  doc.save(`B2B_Order_${formattedDate}.pdf`);
};