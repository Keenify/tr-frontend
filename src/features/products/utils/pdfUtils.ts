import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePDF = (selectedProducts: Set<number>, selectedFlavors: { [key: number]: Set<string> }) => {
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
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, pdfHeight);
            pdf.save('products.pdf');
            document.body.removeChild(clonedTable);
        }).catch(error => {
            console.error('Error generating PDF:', error);
        });
    }
};
