import React from 'react';
import { Session } from '@supabase/supabase-js';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { getProductsByCompany, getProductVariants, getProductPriceTiers } from '../services/useProducts';
import { Product, ProductPriceTier } from '../types/Product';
import { generatePDF } from '../utils/pdfUtils';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';

interface ProductsProps {
    session: Session;
}

const Products: React.FC<ProductsProps> = ({ session }) => {
    // Fetch company information and handle errors
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
                        // Ensure all flavors are selected for each product
                        setSelectedFlavors(prevFlavors => ({
                            ...prevFlavors,
                            [variantsData.productId]: new Set(variantsData.variantNames),
                        }));
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

    // Get unique price tier headers for the table
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

    // Function to toggle flavor selection for a given product
    const toggleFlavorSelection = (productId: number, flavor: string) => {
        setSelectedFlavors(prev => {
            const newFlavors = { ...prev };
            if (!newFlavors[productId]) {
                newFlavors[productId] = new Set();
            }
            if (newFlavors[productId].has(flavor)) {
                newFlavors[productId] = new Set(newFlavors[productId]); // Create a new Set to ensure state change
                newFlavors[productId].delete(flavor); // Uncheck flavor
            } else {
                newFlavors[productId] = new Set(newFlavors[productId]); // Create a new Set to ensure state change
                newFlavors[productId].add(flavor); // Check flavor
            }
            return newFlavors;
        });
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
                onClick={() => generatePDF(selectedProducts, selectedFlavors)}
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
                                                id={`flavor-checkbox-${product.id}-${flavor}`}
                                                checked={selectedFlavors[product.id]?.has(flavor) || false}
                                                onChange={() => toggleFlavorSelection(product.id, flavor)}
                                                disabled={!selectedProducts.has(product.id)} // Disable if product is not selected
                                            />
                                            <label
                                                htmlFor={`flavor-checkbox-${product.id}-${flavor}`}
                                                style={{ marginLeft: '8px', cursor: 'pointer' }}
                                            >
                                                {flavor}
                                            </label>
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
