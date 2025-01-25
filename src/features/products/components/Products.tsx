import React from 'react';
import { Session } from '@supabase/supabase-js';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { getProductsByCompany, getProductVariants, getProductPriceTiers } from '../services/useProducts';
import { Product, ProductPriceTier } from '../types/Product';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';

interface ProductsProps {
    session: Session;
}

const Products: React.FC<ProductsProps> = ({ session }) => {
    const { companyInfo, error } = useUserAndCompanyData(session.user.id);
    const [products, setProducts] = React.useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = React.useState<boolean>(true);
    const [fetchError, setFetchError] = React.useState<string | null>(null);
    const [productVariants, setProductVariants] = React.useState<{ [key: number]: string[] }>({});
    const [productPriceTiers, setProductPriceTiers] = React.useState<{ [key: number]: ProductPriceTier[] }>({});
    const [selectedProducts, setSelectedProducts] = React.useState<Set<number>>(new Set());
    const [selectedFlavors, setSelectedFlavors] = React.useState<{ [key: number]: Set<string> }>({});

    React.useEffect(() => {
        if (companyInfo?.id) {
            setLoadingProducts(true);
            getProductsByCompany(companyInfo.id)
                .then(products => {
                    setProducts(products);
                    // Initialize all products and flavors as selected
                    const initialSelectedProducts = new Set(products.map(product => product.id));
                    const initialSelectedFlavors: { [key: number]: Set<string> } = {};
                    products.forEach(product => {
                        initialSelectedFlavors[product.id] = new Set(productVariants[product.id] || []);
                    });
                    setSelectedProducts(initialSelectedProducts);
                    setSelectedFlavors(initialSelectedFlavors);
                    return Promise.all(
                        products.map(product => {
                            const variantsPromise = getProductVariants(product.id.toString()).then(variants => ({
                                productId: product.id,
                                variantNames: variants.map(variant => variant.name),
                            }));
                            const priceTiersPromise = getProductPriceTiers(product.id.toString()).then(priceTiers => ({
                                productId: product.id,
                                priceTiers,
                            }));
                            return Promise.all([variantsPromise, priceTiersPromise]);
                        })
                    );
                })
                .then(results => {
                    const productPriceTiers: { [key: number]: ProductPriceTier[] } = {};
                    results.forEach(([variantsData, priceTiersData]) => {
                        productVariants[variantsData.productId] = variantsData.variantNames;
                        productPriceTiers[priceTiersData.productId] = priceTiersData.priceTiers;
                    });
                    setProductVariants(productVariants);
                    setProductPriceTiers(productPriceTiers);
                })
                .catch(() => {
                    setFetchError('Failed to load products, variants, or price tiers');
                })
                .finally(() => setLoadingProducts(false));
        }
    }, [companyInfo?.id]);

    const getPriceTierHeaders = () => {
        const allTiers = Object.values(productPriceTiers).flat();
        const uniqueCartons = Array.from(new Set(allTiers.map(tier => tier.min_cartons)));
        return uniqueCartons.sort((a, b) => a - b);
    };

    const priceTierHeaders = getPriceTierHeaders();

    // Function to toggle product selection
    const toggleProductSelection = (productId: number) => {
        setSelectedProducts(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(productId)) {
                newSelection.delete(productId);
                setSelectedFlavors(prevFlavors => {
                    const newFlavors = { ...prevFlavors };
                    newFlavors[productId] = new Set(); // Deselect all flavors
                    return newFlavors;
                });
            } else {
                newSelection.add(productId);
                setSelectedFlavors(prevFlavors => {
                    const newFlavors = { ...prevFlavors };
                    newFlavors[productId] = new Set(productVariants[productId] || []); // Select all flavors
                    return newFlavors;
                });
            }
            return newSelection;
        });
    };

    // Function to toggle flavor selection
    const toggleFlavorSelection = (productId: number, flavor: string) => {
        if (selectedProducts.has(productId)) { // Only allow flavor selection if product is selected
            setSelectedFlavors(prev => {
                const newFlavors = { ...prev };
                if (!newFlavors[productId]) {
                    newFlavors[productId] = new Set();
                }
                if (newFlavors[productId].has(flavor)) {
                    newFlavors[productId].delete(flavor);
                } else {
                    newFlavors[productId].add(flavor);
                }
                return newFlavors;
            });
        }
    };

    const generatePDF = () => {
        const input = document.getElementById('products-table');
        if (input) {
            // Clone the table and filter out unselected products and flavors
            const clonedTable = input.cloneNode(true) as HTMLElement;
            
            // Remove the "Select" column from the cloned table
            const headerCells = clonedTable.querySelectorAll('thead tr th');
            if (headerCells.length > 0) {
                headerCells[0].remove(); // Remove the "Select" header cell
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
                    // Remove the "Select" cell from each row
                    const selectCell = row.querySelector('td');
                    if (selectCell) {
                        selectCell.remove();
                    }
                }
            });

            // Remove all checkboxes from the cloned table
            clonedTable.querySelectorAll('input[type="checkbox"]').forEach(checkbox => checkbox.remove());

            // Ensure the cloned table is appended to the document for html2canvas to work
            document.body.appendChild(clonedTable);
            html2canvas(clonedTable, { scale: 2 }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, pdfHeight);
                pdf.save('products.pdf');
                // Remove the cloned table after generating the PDF
                document.body.removeChild(clonedTable);
            }).catch(error => {
                console.error('Error generating PDF:', error);
            });
        }
    };

    if (loadingProducts) {
        return <div>Loading products...</div>;
    }

    if (error || fetchError) {
        return <div>Error: {error?.message || fetchError}</div>;
    }

    return (
        <div style={{ position: 'relative', padding: '20px' }}>
            <Button
                variant="contained"
                color="primary"
                onClick={generatePDF}
                style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    zIndex: 1,
                }}
            >
                Generate PDF
            </Button>
            <TableContainer component={Paper} id="products-table" style={{ marginTop: '60px' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell align="center" rowSpan={2} style={{ backgroundColor: '#f57c00', color: '#fff', border: '1px solid #ccc' }}>Select</TableCell>
                            <TableCell align="center" rowSpan={2} style={{ backgroundColor: '#f57c00', color: '#fff', border: '1px solid #ccc' }}>Product Name</TableCell>
                            <TableCell align="center" rowSpan={2} style={{ backgroundColor: '#f57c00', color: '#fff', border: '1px solid #ccc' }}>Pack Count Per Box</TableCell>
                            <TableCell align="center" rowSpan={2} style={{ backgroundColor: '#f57c00', color: '#fff', border: '1px solid #ccc' }}>Flavour</TableCell>
                            <TableCell align="center" colSpan={priceTierHeaders.length} style={{ backgroundColor: '#f57c00', color: '#fff', border: '1px solid #ccc' }}>Price per unit (SGD)</TableCell>
                            <TableCell align="center" rowSpan={2} style={{ backgroundColor: '#f57c00', color: '#fff', border: '1px solid #ccc' }}>Recommended Retail Price</TableCell>
                        </TableRow>
                        <TableRow>
                            {priceTierHeaders.map(carton => (
                                <TableCell key={carton} align="center" style={{ backgroundColor: '#f57c00', color: '#fff', border: '1px solid #ccc' }}>{`≥${carton} carton`}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {products.map(product => (
                            <TableRow key={product.id} hover data-product-id={product.id}>
                                <TableCell align="center" style={{ border: '1px solid #ccc' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedProducts.has(product.id)}
                                        onChange={() => toggleProductSelection(product.id)}
                                    />
                                </TableCell>
                                <TableCell align="center" style={{ whiteSpace: 'pre-wrap', border: '1px solid #ccc' }}>{product.name.replace(/-/g, '\n')}</TableCell>
                                <TableCell align="center" style={{ border: '1px solid #ccc' }}>{product.pack_count_per_box}</TableCell>
                                <TableCell align="center" style={{ whiteSpace: 'nowrap', border: '1px solid #ccc', textAlign: 'center' }}>
                                    {productVariants[product.id]?.map(flavor => (
                                        <div key={flavor} style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', whiteSpace: 'nowrap' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedFlavors[product.id]?.has(flavor) || false}
                                                onChange={() => toggleFlavorSelection(product.id, flavor)}
                                            />
                                            <span style={{ marginLeft: '8px' }}>{flavor}</span>
                                        </div>
                                    )) || 'N/A'}
                                </TableCell>
                                {priceTierHeaders.map(carton => (
                                    <TableCell key={carton} align="center" style={{ border: '1px solid #ccc' }}>
                                        {productPriceTiers[product.id]?.find(tier => tier.min_cartons === carton)?.price_per_unit || 'N/A'}
                                    </TableCell>
                                ))}
                                <TableCell align="center" style={{ border: '1px solid #ccc' }}>
                                    {product.recommended_retail_price ? `$${parseFloat(product.recommended_retail_price).toFixed(2)}` : 'N/A'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
};

export default Products;
