import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { CompanyData } from "../../../shared/types/companyType";

export const generatePDF = (
  selectedProducts: Set<number>,
  selectedFlavors: { [key: number]: Set<string> },
  companyInfo: CompanyData,
  customerCompanyName: string,
  currentDate: string
) => {
  const doc = new jsPDF();

  // Add company header with logo
  if (companyInfo) {
    const logoImg = new Image();
    logoImg.src = companyInfo.logo_url; // Assuming logo_url is part of CompanyData

    logoImg.onload = () => {
      // Draw a box around the company info
      doc.setLineWidth(0.5);
      doc.rect(10, 10, 190, 35); // Adjusted height for compactness

      doc.addImage(logoImg, "PNG", 15, 15, 25, 25); // Adjusted size and position for compactness
      doc.setFontSize(14); // Consistent font size for header and client info
      doc.text(companyInfo.name, 45, 20); // Adjusted position
      doc.setFontSize(10);
      doc.text(companyInfo.address, 45, 25);
      doc.text(companyInfo.phone, 45, 30);
      doc.text(companyInfo.website_url, 45, 35);

      // Add client information
      doc.setFontSize(14);
      doc.text("Quotation To:", 10, 50);
      doc.setFontSize(12);
      doc.text(customerCompanyName, 45, 50);
      doc.text(`Updated At: ${currentDate}`, 10, 55);

      // Proceed with the rest of the PDF generation
      generateProductTable(
        doc,
        selectedProducts,
        selectedFlavors,
        customerCompanyName
      );
    };
  } else {
    generateProductTable(
      doc,
      selectedProducts,
      selectedFlavors,
      customerCompanyName
    );
  }
};

function generateProductTable(
  doc: jsPDF,
  selectedProducts: Set<number>,
  selectedFlavors: { [key: number]: Set<string> },
  customerCompanyName: string
) {
  const input = document.getElementById("products-table");
  if (input) {
    const clonedTable = input.cloneNode(true) as HTMLElement;

    // Remove the select column header
    const headerCells = clonedTable.querySelectorAll("thead tr th");
    if (headerCells.length > 0) {
      headerCells[0].remove();
    }

    // Process each row
    const rows = clonedTable.querySelectorAll("tbody tr");
    rows.forEach((row) => {
      const productId = parseInt(row.getAttribute("data-product-id") || "", 10);
      if (!selectedProducts.has(productId)) {
        row.remove();
      } else {
        // Keep variant images for selected products
        const packagingCell = row.querySelector("td:nth-child(3)");
        if (packagingCell) {
          const variantImages = packagingCell.querySelectorAll("img");
          variantImages.forEach(img => {
            // Ensure images are visible
            img.style.display = "block";
            img.style.width = "50px"; // Set a consistent size
            img.style.height = "50px";
            img.style.margin = "2px auto";
          });
        }

        // Process flavor cells
        const flavorCells = row.querySelectorAll("td:nth-child(5) div");
        flavorCells.forEach((flavorDiv) => {
          const flavor = flavorDiv.textContent?.trim() || "";
          if (!selectedFlavors[productId]?.has(flavor)) {
            flavorDiv.remove();
          }
        });

        // Remove the select column
        const selectCell = row.querySelector("td:first-child");
        if (selectCell) {
          selectCell.remove();
        }
      }
    });

    // Remove all checkboxes
    clonedTable
      .querySelectorAll('input[type="checkbox"]')
      .forEach((checkbox) => checkbox.remove());

    // Temporarily append the cloned table to the document
    document.body.appendChild(clonedTable);

    // Use html2canvas with improved settings
    html2canvas(clonedTable, {
      scale: 2,
      logging: false,
      useCORS: true, // Enable CORS for images
      allowTaint: true, // Allow cross-origin images
      imageTimeout: 15000, // Increase timeout for image loading
      onclone: (clonedDoc) => {
        // Additional processing of the cloned document if needed
        const images = clonedDoc.getElementsByTagName('img');
        for (let img of images) {
          img.crossOrigin = "anonymous";
        }
      }
    })
      .then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdfWidth = doc.internal.pageSize.getWidth() - 20;
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        doc.addImage(imgData, "PNG", 10, 60, pdfWidth, pdfHeight);

        // Format the current date and time
        const now = new Date();
        const formattedDate = `${now.getDate().toString().padStart(2, "0")}-${(
          now.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}-${now.getFullYear()}_${now
          .getHours()
          .toString()
          .padStart(2, "0")}-${now
          .getMinutes()
          .toString()
          .padStart(2, "0")}-${now.getSeconds().toString().padStart(2, "0")}`;

        // Save the PDF
        doc.save(`${customerCompanyName}_${formattedDate}.pdf`);

        // Clean up
        document.body.removeChild(clonedTable);
      })
      .catch((error) => {
        console.error("Error generating PDF:", error);
        document.body.removeChild(clonedTable);
      });
  }
}
