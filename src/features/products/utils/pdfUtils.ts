import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CompanyData } from '../../../shared/types/companyType';

export const generatePDF = (selectedProducts: Set<number>, selectedFlavors: { [key: number]: Set<string> }, companyInfo: CompanyData) => {
    const doc = new jsPDF();

    // Add company header with logo
    if (companyInfo) {
        const logoImg = new Image();
        logoImg.src = companyInfo.logo_url; // Assuming logo_url is part of CompanyData

        logoImg.onload = () => {
            doc.addImage(logoImg, 'PNG', 10, 10, 30, 30); // Add logo at the top-left corner
            doc.setFontSize(16);
            doc.text(companyInfo.name, 50, 20); // Align text to the right of the logo
            doc.setFontSize(12);
            doc.text(companyInfo.address, 50, 30);
            doc.text(companyInfo.phone, 50, 40);
            doc.text(companyInfo.website_url, 50, 50);

            // Proceed with the rest of the PDF generation
            generateProductTable(doc, selectedProducts, selectedFlavors);
        };
    } else {
        generateProductTable(doc, selectedProducts, selectedFlavors);
    }
};

function generateProductTable(doc: jsPDF, selectedProducts: Set<number>, selectedFlavors: { [key: number]: Set<string> }) {
    const input = document.getElementById('products-table');
    if (input) {
        const clonedTable = input.cloneNode(true) as HTMLElement;

        const headerCells = clonedTable.querySelectorAll('thead tr th');
        if (headerCells.length > 0) {
            headerCells[0].remove();
        }

        const rows = clonedTable.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const productId = parseInt(row.getAttribute('data-product-id') || '', 10);
            if (!selectedProducts.has(productId)) {
                row.remove();
            } else {
                const flavorCells = row.querySelectorAll('td:nth-child(4) div');
                flavorCells.forEach(flavorDiv => {
                    const flavor = flavorDiv.textContent || '';
                    if (!selectedFlavors[productId]?.has(flavor)) {
                        flavorDiv.remove();
                    }
                });
                const selectCell = row.querySelector('td');
                if (selectCell) {
                    selectCell.remove();
                }
            }
        });

        clonedTable.querySelectorAll('input[type="checkbox"]').forEach(checkbox => checkbox.remove());

        document.body.appendChild(clonedTable);
        html2canvas(clonedTable, { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdfWidth = doc.internal.pageSize.getWidth() - 20;
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            doc.addImage(imgData, 'PNG', 10, 60, pdfWidth, pdfHeight); // Adjust Y position to avoid overlap
            doc.save('products.pdf');
            document.body.removeChild(clonedTable);
        }).catch(error => {
            console.error('Error generating PDF:', error);
        });
    }
}
