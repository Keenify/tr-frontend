import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { B2BOrderRow } from '../types/B2BOrderTypes';
import { CompanyData } from '../../../shared/types/companyType';

export const generateB2BOrderPDF = (
  rows: B2BOrderRow[],
  companyInfo: CompanyData
) => {
  const doc = new jsPDF();

  // Add company header
  if (companyInfo) {
    // Draw a box around the company info
    doc.setLineWidth(0.5);
    doc.rect(10, 10, 190, 35);

    // Add company logo if available
    if (companyInfo.logo_url) {
      const logoImg = new Image();
      logoImg.src = companyInfo.logo_url;

      logoImg.onload = () => {
        doc.addImage(logoImg, 'PNG', 15, 15, 25, 25);
        addCompanyDetails();
      };

      logoImg.onerror = () => {
        addCompanyDetails();
      };
    } else {
      addCompanyDetails();
    }

    function addCompanyDetails() {
      doc.setFontSize(14);
      doc.text(companyInfo.name, 45, 20);
      doc.setFontSize(10);
      doc.text(companyInfo.address || '', 45, 25);
      doc.text(companyInfo.phone || '', 45, 30);
      doc.text(companyInfo.website_url || '', 45, 35);

      // Add B2B Order title
      doc.setFontSize(16);
      doc.text('B2B Order', 10, 55);

      // Add current date
      const currentDate = new Date().toLocaleDateString();
      doc.setFontSize(10);
      doc.text(`Date: ${currentDate}`, 10, 62);

      // Generate the table
      generateTable();
    }
  } else {
    generateTable();
  }

  function generateTable() {
    const tableElement = document.getElementById('b2b-order-table');

    if (tableElement) {
      const clonedTable = tableElement.cloneNode(true) as HTMLElement;

      // Remove action columns from the cloned table
      const actionHeaders = clonedTable.querySelectorAll('th:last-child');
      actionHeaders.forEach(header => header.remove());

      const actionCells = clonedTable.querySelectorAll('td.actions-cell');
      actionCells.forEach(cell => cell.remove());

      // Clean up the table for PDF
      const buttons = clonedTable.querySelectorAll('button');
      buttons.forEach(button => button.remove());

      // Replace input fields with their values
      const inputs = clonedTable.querySelectorAll('input');
      inputs.forEach(input => {
        const span = document.createElement('span');
        span.textContent = (input as HTMLInputElement).value;
        input.parentNode?.replaceChild(span, input);
      });

      // Replace select fields with their selected text
      const selects = clonedTable.querySelectorAll('select');
      selects.forEach(select => {
        const span = document.createElement('span');
        const selectedOption = (select as HTMLSelectElement).selectedOptions[0];
        span.textContent = selectedOption ? selectedOption.text : '';
        select.parentNode?.replaceChild(span, select);
      });

      // Style the cloned table for better PDF appearance
      clonedTable.style.width = '100%';
      clonedTable.style.borderCollapse = 'collapse';

      // Temporarily append to document
      document.body.appendChild(clonedTable);

      html2canvas(clonedTable, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = doc.internal.pageSize.getWidth() - 20;
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        // Position the table below the header
        const yPosition = companyInfo ? 70 : 20;
        doc.addImage(imgData, 'PNG', 10, yPosition, pdfWidth, pdfHeight);

        // Calculate totals
        const totalPax = rows.reduce((sum, row) => sum + row.pax, 0);
        const totalAmount = rows.reduce((sum, row) => sum + (row.pax * row.amountPerPerson), 0);

        // Add summary at the bottom
        const summaryY = yPosition + pdfHeight + 10;
        doc.setFontSize(12);
        doc.text(`Total Pax: ${totalPax}`, 10, summaryY);
        doc.text(`Total Amount: $${totalAmount.toFixed(2)}`, 10, summaryY + 7);

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

        // Clean up
        document.body.removeChild(clonedTable);
      }).catch(error => {
        console.error('Error generating PDF:', error);
        document.body.removeChild(clonedTable);
      });
    }
  }
};