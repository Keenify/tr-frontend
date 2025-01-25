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

    // State to manage column visibility
    const [showPackCount, setShowPackCount] = React.useState<boolean>(true);
    const [showRetailPrice, setShowRetailPrice] = React.useState<boolean>(true);

    // State to manage visible carton columns
    const [visibleCartonColumns, setVisibleCartonColumns] = React.useState<Set<number>>(new Set());

    // State to manage editing
    const [editingCell, setEditingCell] = React.useState<{ productId: number; field: string } | null>(null);
    const [editValue, setEditValue] = React.useState<string>('');

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

    // Function to get unique price tier headers for the table
    const getPriceTierHeaders = () => {
        const allTiers = Object.values(productPriceTiers).flat();
        const uniqueCartons = Array.from(new Set(allTiers.map(tier => tier.min_cartons)));
        return uniqueCartons.sort((a, b) => a - b);
    };

    const priceTierHeaders = React.useMemo(() => getPriceTierHeaders(), [productPriceTiers]);

    // Initialize visible carton columns
    React.useEffect(() => {
        setVisibleCartonColumns(new Set(priceTierHeaders));
    }, [priceTierHeaders]);

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

    // Function to toggle carton column visibility
    const toggleCartonColumn = (carton: number) => {
        setVisibleCartonColumns(prev => {
            const newVisibleCartonColumns = new Set(prev);
            if (newVisibleCartonColumns.has(carton)) {
                newVisibleCartonColumns.delete(carton);
            } else {
                newVisibleCartonColumns.add(carton);
            }
            // Convert to array, sort, and convert back to set
            return new Set(Array.from(newVisibleCartonColumns).sort((a, b) => a - b));
        });
    };

    // Function to handle double-click to edit
    const handleDoubleClick = (productId: number, field: string, value: string) => {
        setEditingCell({ productId, field });
        setEditValue(value);
    };

    // Function to handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditValue(e.target.value);
    };

    // Function to handle input blur (save changes)
    const handleBlur = (productId: number, field: string) => {
        // Update the product data with the new value
        setProducts(prevProducts =>
            prevProducts.map(product =>
                product.id === productId ? { ...product, [field]: editValue } : product
            )
        );
        setEditingCell(null);
    };

    if (loadingProducts) {
        return <div>Loading products...</div>;
    }

    if (error || fetchError) {
        return <div>Error: {error?.message || fetchError}</div>;
    }

    return (
        <div style={{ position: 'relative', padding: '20px' }}>
            <div style={{ marginBottom: '10px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px', width: 'fit-content' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={showPackCount}
                            onChange={() => setShowPackCount(prev => !prev)}
                            style={{ marginRight: '8px' }}
                        />
                        Show Pack Count Per Box
                    </label>
                    {priceTierHeaders.map(carton => (
                        <label key={carton} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginTop: '10px' }}>
                            <input
                                type="checkbox"
                                checked={visibleCartonColumns.has(carton)}
                                onChange={() => toggleCartonColumn(carton)}
                                style={{ marginRight: '8px' }}
                            />
                            {`Show ≥${carton} Carton`}
                        </label>
                    ))}
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginTop: '10px' }}>
                        <input
                            type="checkbox"
                            checked={showRetailPrice}
                            onChange={() => setShowRetailPrice(prev => !prev)}
                            style={{ marginRight: '8px' }}
                        />
                        Show Recommended Retail Price
                    </label>
                </div>
            </div>
            <TableContainer component={Paper} id="products-table" style={{ marginTop: '20px' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell align="center" rowSpan={2} style={{ backgroundColor: '#f57c00', color: '#fff', border: '1px solid #ccc' }}>Select</TableCell>
                            <TableCell align="center" rowSpan={2} style={{ backgroundColor: '#f57c00', color: '#fff', border: '1px solid #ccc' }}>Product Name</TableCell>
                            {showPackCount && (
                                <TableCell align="center" rowSpan={2} style={{ backgroundColor: '#f57c00', color: '#fff', border: '1px solid #ccc' }}>Pack Count Per Box</TableCell>
                            )}
                            <TableCell align="center" rowSpan={2} style={{ backgroundColor: '#f57c00', color: '#fff', border: '1px solid #ccc' }}>Flavour</TableCell>
                            {visibleCartonColumns.size > 0 && (
                                <TableCell align="center" colSpan={visibleCartonColumns.size} style={{ backgroundColor: '#f57c00', color: '#fff', border: '1px solid #ccc' }}>Price per unit (SGD)</TableCell>
                            )}
                            {showRetailPrice && (
                                <TableCell align="center" rowSpan={2} style={{ backgroundColor: '#f57c00', color: '#fff', border: '1px solid #ccc' }}>Recommended Retail Price</TableCell>
                            )}
                        </TableRow>
                        <TableRow>
                            {Array.from(visibleCartonColumns).map(carton => (
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
                                {showPackCount && (
                                    <TableCell
                                        align="center"
                                        style={{ border: '1px solid #ccc' }}
                                        onDoubleClick={() => handleDoubleClick(product.id, 'pack_count_per_box', product.pack_count_per_box.toString())}
                                    >
                                        {editingCell?.productId === product.id && editingCell.field === 'pack_count_per_box' ? (
                                            <input
                                                type="text"
                                                value={editValue}
                                                onChange={handleInputChange}
                                                onBlur={() => handleBlur(product.id, 'pack_count_per_box')}
                                                autoFocus
                                            />
                                        ) : (
                                            product.pack_count_per_box
                                        )}
                                    </TableCell>
                                )}
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
                                {Array.from(visibleCartonColumns).map(carton => (
                                    <TableCell
                                        key={carton}
                                        align="center"
                                        style={{ border: '1px solid #ccc' }}
                                        onDoubleClick={() => handleDoubleClick(product.id, `price_${carton}`, productPriceTiers[product.id]?.find(tier => tier.min_cartons === carton)?.price_per_unit.toString() || '')}
                                    >
                                        {editingCell?.productId === product.id && editingCell.field === `price_${carton}` ? (
                                            <input
                                                type="text"
                                                value={editValue}
                                                onChange={handleInputChange}
                                                onBlur={() => handleBlur(product.id, `price_${carton}`)}
                                                autoFocus
                                            />
                                        ) : (
                                            productPriceTiers[product.id]?.find(tier => tier.min_cartons === carton)?.price_per_unit || 'N/A'
                                        )}
                                    </TableCell>
                                ))}
                                {showRetailPrice && (
                                    <TableCell
                                        align="center"
                                        style={{ border: '1px solid #ccc' }}
                                        onDoubleClick={() => handleDoubleClick(product.id, 'recommended_retail_price', product.recommended_retail_price.toString())}
                                    >
                                        {editingCell?.productId === product.id && editingCell.field === 'recommended_retail_price' ? (
                                            <input
                                                type="text"
                                                value={editValue}
                                                onChange={handleInputChange}
                                                onBlur={() => handleBlur(product.id, 'recommended_retail_price')}
                                                autoFocus
                                            />
                                        ) : (
                                            product.recommended_retail_price ? `$${parseFloat(product.recommended_retail_price).toFixed(2)}` : 'N/A'
                                        )}
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Button
                variant="contained"
                color="primary"
                onClick={() => generatePDF(selectedProducts, selectedFlavors)}
                style={{
                    marginTop: '20px',
                    marginLeft: 'auto',
                    display: 'block'
                }}
            >
                Generate PDF
            </Button>
        </div>
    );
};

export default Products;
