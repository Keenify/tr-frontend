import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { B2BOrderRow } from '../types/B2BOrderTypes';

const generateProductTable = (doc: jsPDF, rows: B2BOrderRow[], companyInfo?: any) => {
  const input = document.getElementById('b2b-order-table');
  if (input) {
    const clonedTable = input.cloneNode(true) as HTMLElement;

    // Remove the actions column header
    const headerCells = clonedTable.querySelectorAll('thead tr th');
    if (headerCells.length > 0) {
      headerCells[headerCells.length - 1].remove(); // Remove last column (Actions)
    }

    // Process each row
    const tableRows = clonedTable.querySelectorAll('tbody tr');
    tableRows.forEach((row) => {
      // Remove the actions column
      const cells = row.querySelectorAll('td');
      if (cells.length > 0) {
        cells[cells.length - 1].remove(); // Remove last cell (Actions)
      }

      // Remove all buttons
      const buttons = row.querySelectorAll('button');
      buttons.forEach(button => button.remove());

      // Replace input fields with their values
      const inputs = row.querySelectorAll('input');
      inputs.forEach(input => {
        const span = document.createElement('span');
        span.textContent = (input as HTMLInputElement).value;
        span.style.display = 'inline-block';
        span.style.padding = '4px';
        input.parentNode?.replaceChild(span, input);
      });

      // Replace select fields with their selected text
      const selects = row.querySelectorAll('select');
      selects.forEach(select => {
        const span = document.createElement('span');
        const selectedOption = (select as HTMLSelectElement).selectedOptions[0];
        span.textContent = selectedOption ? selectedOption.text : '';
        span.style.display = 'inline-block';
        span.style.padding = '4px';
        select.parentNode?.replaceChild(span, select);
      });

      // Handle custom dietary inputs
      const customInputs = row.querySelectorAll('.custom-dietary-input');
      customInputs.forEach(input => {
        const span = document.createElement('span');
        span.textContent = (input as HTMLInputElement).value || 'Custom';
        span.style.display = 'inline-block';
        span.style.padding = '4px';
        input.parentNode?.replaceChild(span, input);
      });
    });

    // Remove all error messages
    const errorMessages = clonedTable.querySelectorAll('.error-message');
    errorMessages.forEach(error => error.remove());

    // Style the cloned table for PDF
    const table = clonedTable.querySelector('table');
    if (table) {
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.fontSize = '18px'; // Larger font size for better readability

      // Style all cells with increased padding
      const cells = table.querySelectorAll('td, th');
      cells.forEach(cell => {
        (cell as HTMLElement).style.border = '1px solid #d1d5db';
        (cell as HTMLElement).style.padding = '16px'; // Increased padding
        (cell as HTMLElement).style.textAlign = 'left';
      });

      // Style header
      const headers = table.querySelectorAll('th');
      headers.forEach(header => {
        (header as HTMLElement).style.backgroundColor = '#667eea';
        (header as HTMLElement).style.color = 'white';
        (header as HTMLElement).style.fontWeight = 'bold';
        (header as HTMLElement).style.fontSize = '18px';
      });

      // Style summary row
      const footerCells = table.querySelectorAll('tfoot td');
      footerCells.forEach(cell => {
        (cell as HTMLElement).style.backgroundColor = '#f3f4f6';
        (cell as HTMLElement).style.fontWeight = 'bold';
      });
    }

    // Temporarily append the cloned table to the document
    document.body.appendChild(clonedTable);

    // Use html2canvas with improved settings - larger scale for bigger table
    html2canvas(clonedTable, {
      scale: 3,
      logging: false,
      useCORS: true,
      allowTaint: true,
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        const images = clonedDoc.getElementsByTagName('img');
        for (let img of images) {
          img.crossOrigin = 'anonymous';
        }
      }
    })
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = doc.internal.pageSize.getWidth() - 20;
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        // Position the table with proper spacing after title
        const tableY = companyInfo ? 68 : 45;
        doc.addImage(imgData, 'PNG', 10, tableY, pdfWidth, pdfHeight);

        // Format the current date and time - matching quotation format
        const now = new Date();
        const formattedDate = `${now.getDate().toString().padStart(2, '0')}-${(
          now.getMonth() + 1
        )
          .toString()
          .padStart(2, '0')}-${now.getFullYear()}_${now
          .getHours()
          .toString()
          .padStart(2, '0')}-${now
          .getMinutes()
          .toString()
          .padStart(2, '0')}-${now.getSeconds().toString().padStart(2, '0')}`;

        // Save the PDF
        doc.save(`Order_Budget_Tracker_${formattedDate}.pdf`);

        // Clean up
        document.body.removeChild(clonedTable);
      })
      .catch((error) => {
        console.error('Error generating PDF:', error);
        document.body.removeChild(clonedTable);
        throw error;
      });
  }
};

export const generateB2BOrderPDFEnhanced = (rows: B2BOrderRow[], companyInfo?: any) => {
  try {
    console.log('PDF Generator called with:', { rows, companyInfo });
    const doc = new jsPDF();

    // Add company header with logo - matching quotation layout
    if (companyInfo) {
      const logoImg = new Image();
      logoImg.src = companyInfo.logo_url;

      logoImg.onload = () => {
        // Draw a box around the company info
        doc.setLineWidth(0.5);
        doc.rect(10, 10, 190, 35); // Adjusted height for compactness

        doc.addImage(logoImg, 'PNG', 15, 15, 25, 25); // Adjusted size and position for compactness
        doc.setFontSize(14); // Consistent font size for header and client info
        doc.text(companyInfo.name, 45, 20); // Adjusted position
        doc.setFontSize(10);
        doc.text(companyInfo.address || '', 45, 25);
        doc.text(companyInfo.phone || '', 45, 30);
        doc.text(companyInfo.website_url || '', 45, 35);

        // Add Order Budget Tracker information with theme color and centered
        doc.setTextColor(102, 126, 234); // #667eea theme color
        doc.setFontSize(22);
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.text('Order Budget Tracker', pageWidth / 2, 50, { align: 'center' });

        doc.setTextColor(0, 0, 0); // Reset to black
        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, pageWidth / 2, 58, { align: 'center' });

        // Proceed with table generation
        generateProductTable(doc, rows, companyInfo);
      };

      logoImg.onerror = () => {
        // If logo fails to load, proceed without it
        doc.setLineWidth(0.5);
        doc.rect(10, 10, 190, 35);

        doc.setFontSize(14);
        doc.text(companyInfo.name, 15, 20);
        doc.setFontSize(10);
        doc.text(companyInfo.address || '', 15, 25);
        doc.text(companyInfo.phone || '', 15, 30);
        doc.text(companyInfo.website_url || '', 15, 35);

        // Add Order Budget Tracker information with theme color and centered
        doc.setTextColor(102, 126, 234); // #667eea theme color
        doc.setFontSize(22);
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.text('Order Budget Tracker', pageWidth / 2, 50, { align: 'center' });

        doc.setTextColor(0, 0, 0); // Reset to black
        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, pageWidth / 2, 58, { align: 'center' });

        generateProductTable(doc, rows, companyInfo);
      };
    } else {
      // Add title and date when no company info with theme color and centered
      doc.setTextColor(102, 126, 234); // #667eea theme color
      doc.setFontSize(22);
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.text('Order Budget Tracker', pageWidth / 2, 25, { align: 'center' });

      doc.setTextColor(0, 0, 0); // Reset to black
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, pageWidth / 2, 35, { align: 'center' });

      generateProductTable(doc, rows, companyInfo);
    }
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
};