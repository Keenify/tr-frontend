import {
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import { Session } from "@supabase/supabase-js";
import React from "react";
import PriceTierModal from "./PriceTierModal";
import { getProductsByCompany } from "../../../services/useProducts";
import { getProductPriceTiers } from "../services/useProductsPriceTier";
import { getProductVariants } from "../../../services/useProductVariants";
import { generateQuotationPDF } from "../services/useQuotationPDF";
import { useUserAndCompanyData } from "../../../shared/hooks/useUserAndCompanyData";
import { Product, ProductPriceTier } from "../../../shared/types/Product";
import { QuotationPDFData } from "../types/QuotationPDF";
import "../styles/Quotation.css";

interface QuotationB2BProps {
  session: Session;
}

export const QuotationB2B: React.FC<QuotationB2BProps> = ({ session }) => {
  const { companyInfo, error } = useUserAndCompanyData(session.user.id);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = React.useState<boolean>(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [productVariants, setProductVariants] = React.useState<{
    [key: number]: Array<{
      id: number;
      name: string;
      image_url: string | null;
    }>;
  }>({});
  const [productPriceTiers, setProductPriceTiers] = React.useState<{
    [key: number]: ProductPriceTier[];
  }>({});
  const [selectedProducts, setSelectedProducts] = React.useState<Set<number>>(
    new Set()
  );
  const [selectedFlavors, setSelectedFlavors] = React.useState<{
    [key: number]: Set<string>;
  }>({});
  const [showPackCount, setShowPackCount] = React.useState<boolean>(true);
  const [showRetailPrice, setShowRetailPrice] = React.useState<boolean>(true);
  const [visibleCartonColumns, setVisibleCartonColumns] = React.useState<
    Set<number>
  >(new Set());
  const [editingCell, setEditingCell] = React.useState<{
    productId: number;
    field: string;
  } | null>(null);
  const [editValue, setEditValue] = React.useState<string>("");
  const [customerCompanyName, setCustomerCompanyName] =
    React.useState<string>("");
  const [isPriceTierModalOpen, setIsPriceTierModalOpen] =
    React.useState<boolean>(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState<boolean>(false);
  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Copy all the existing state and functions from the original Quotation component
  // Lines 51-570 from the original Quotation.tsx
  // Add new state for footer text
  const [footerText, setFooterText] = React.useState<string>(
    `*Remarks:
1. All prices above are subject to prevailing GST
2. All goods sold are not returnable
3. Mixing of products within the same carton is not allowed
4. Discount is applicable to same product category
5. FREE delivery to ONE location, $8 delivery fee to every subsequent location
6. Validity of Quotation: 30 days`
  );

  React.useEffect(() => {
    if (companyInfo?.id) {
      setLoadingProducts(true);
      getProductsByCompany(companyInfo.id)
        .then((products) => {
          setProducts(products);
          // Initialize all products as unselected (empty Set)
          setSelectedProducts(new Set());

          return Promise.all(
            products.map((product) => {
              const variantsPromise = getProductVariants(product.id.toString())
                .then((variants) => ({
                  productId: product.id,
                  variantNames: variants.map((variant) => variant.name),
                  variants: variants,
                }))
                .catch(() => ({
                  productId: product.id,
                  variantNames: [],
                  variants: [],
                }));

              const priceTiersPromise = getProductPriceTiers(
                product.id.toString()
              )
                .then((priceTiers) => ({
                  productId: product.id,
                  priceTiers,
                }))
                .catch(() => ({
                  productId: product.id,
                  priceTiers: [], // Empty array for products with no price tiers
                }));

              return Promise.all([variantsPromise, priceTiersPromise]);
            })
          );
        })
        .then((results) => {
          const newProductVariants: {
            [key: number]: Array<{
              id: number;
              name: string;
              image_url: string | null;
            }>;
          } = {};
          const newProductPriceTiers: { [key: number]: ProductPriceTier[] } =
            {};
          const initialSelectedFlavors: { [key: number]: Set<string> } = {};

          results.forEach(([variantsData, priceTiersData]) => {
            newProductVariants[variantsData.productId] = variantsData.variants;
            newProductPriceTiers[priceTiersData.productId] =
              priceTiersData.priceTiers;
            // Initialize selected flavors only if variants exist
            initialSelectedFlavors[variantsData.productId] = new Set(
              variantsData.variantNames
            );
          });

          setProductVariants(newProductVariants);
          setProductPriceTiers(newProductPriceTiers);
          setSelectedFlavors(initialSelectedFlavors);
        })
        .catch(() => {
          setFetchError("Failed to load products, variants, or price tiers");
        })
        .finally(() => setLoadingProducts(false));
    }
  }, [companyInfo?.id]);

  // Function to get unique price tier headers for the table
  const getPriceTierHeaders = () => {
    const allTiers = Object.values(productPriceTiers).flat();
    const uniqueCartons = Array.from(
      new Set(allTiers.map((tier) => tier.min_cartons))
    );
    return uniqueCartons.sort((a, b) => a - b);
  };

  const priceTierHeaders = React.useMemo(
    () => getPriceTierHeaders(),
    [productPriceTiers]
  );

  // Initialize visible carton columns
  React.useEffect(() => {
    setVisibleCartonColumns(new Set(priceTierHeaders));
  }, [priceTierHeaders]);

  // Function to toggle product selection
  const toggleProductSelection = (productId: number) => {
    setSelectedProducts((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(productId)) {
        newSelection.delete(productId);
        setSelectedFlavors((prevFlavors) => {
          const newFlavors = { ...prevFlavors };
          newFlavors[productId] = new Set(); // Deselect all flavors
          return newFlavors;
        });
      } else {
        newSelection.add(productId);
        setSelectedFlavors((prevFlavors) => {
          const newFlavors = { ...prevFlavors };
          newFlavors[productId] = new Set(
            productVariants[productId]?.map((variant) => variant.name) || []
          ); // Select all flavors
          return newFlavors;
        });
      }
      return newSelection;
    });
  };

  // Function to toggle flavor selection for a given product
  const toggleFlavorSelection = (productId: number, flavor: string) => {
    setSelectedFlavors((prev) => {
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
    setVisibleCartonColumns((prev) => {
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
  const handleDoubleClick = (
    productId: number,
    field: string,
    value: string
  ) => {
    setEditingCell({ productId, field });
    setEditValue(value);
  };

  // Function to handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  // Function to handle input blur (save changes)
  const handleBlur = (productId: number, field: string) => {
    setProducts((prevProducts) =>
      prevProducts.map((product) => {
        if (product.id === productId) {
          if (field.startsWith("price_")) {
            const carton = parseInt(field.split("_")[1], 10);
            const updatedPriceTiers = productPriceTiers[productId].map((tier) =>
              tier.min_cartons === carton
                ? { ...tier, price_per_unit: editValue }
                : tier
            );
            setProductPriceTiers((prev) => ({
              ...prev,
              [productId]: updatedPriceTiers,
            }));
          } else {
            return { ...product, [field]: editValue };
          }
        }
        return product;
      })
    );
    setEditingCell(null);
  };

  // Function to handle input key down (save changes on Enter key)
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    productId: number,
    field: string
  ) => {
    if (e.key === "Enter") {
      handleBlur(productId, field);
    }
  };

  const handlePriceTierUpdate = (
    productId: number,
    updatedTiers: ProductPriceTier[]
  ) => {
    setProductPriceTiers((prev) => ({
      ...prev,
      [productId]: updatedTiers,
    }));
  };

  if (loadingProducts) {
    return <div>Loading products...</div>;
  }

  if (error || fetchError) {
    return <div>Error: {error?.message || fetchError}</div>;
  }

  return (
    <div className="quotation-container">
      <Grid container spacing={2} className="customer-info-container">
        <Grid item xs={6}>
          <TextField
            label="Customer Company Name"
            variant="outlined"
            fullWidth
            value={customerCompanyName}
            onChange={(e) => setCustomerCompanyName(e.target.value)}
            placeholder="Enter client company name"
          />
          <div className="date-container">Updated At: {currentDate}</div>
        </Grid>

        <Grid item xs={6}>
          <div className="toggle-container">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={showPackCount}
                onChange={() => setShowPackCount((prev) => !prev)}
              />
              Show Pack Count Per Box
            </label>
            {priceTierHeaders.map((carton) => (
              <label key={carton} className="toggle-label">
                <input
                  type="checkbox"
                  checked={visibleCartonColumns.has(carton)}
                  onChange={() => toggleCartonColumn(carton)}
                />
                {`Show ≥${carton} Carton`}
              </label>
            ))}
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={showRetailPrice}
                onChange={() => setShowRetailPrice((prev) => !prev)}
              />
              Show Recommended Retail Price
            </label>
          </div>
        </Grid>
      </Grid>

      <TableContainer
        component={Paper}
        id="products-table"
        className="products-table"
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell
                align="center"
                rowSpan={2}
                className="table-header-cell"
                style={{ width: "60px" }}
              >
                Select
              </TableCell>
              <TableCell
                align="center"
                rowSpan={2}
                className="table-header-cell"
                style={{ width: "15%" }}
              >
                Product Name
              </TableCell>
              <TableCell
                align="center"
                rowSpan={2}
                className="table-header-cell"
                style={{ width: "120px" }}
              >
                Packaging
              </TableCell>
              {showPackCount && (
                <TableCell
                  align="center"
                  rowSpan={2}
                  className="table-header-cell"
                  style={{ width: "80px" }}
                >
                  Pack Count Per Box
                </TableCell>
              )}
              <TableCell
                align="center"
                rowSpan={2}
                className="table-header-cell"
                style={{ width: "15%" }}
              >
                Flavour
              </TableCell>
              {visibleCartonColumns.size > 0 && (
                <TableCell
                  align="center"
                  colSpan={visibleCartonColumns.size}
                  className="table-header-cell"
                >
                  Price per unit (SGD)
                </TableCell>
              )}
              {showRetailPrice && (
                <TableCell
                  align="center"
                  rowSpan={2}
                  className="table-header-cell"
                  style={{ width: "100px" }}
                >
                  Recommended Retail Price
                </TableCell>
              )}
            </TableRow>
            <TableRow>
              {Array.from(visibleCartonColumns).map((carton) => (
                <TableCell
                  key={carton}
                  align="center"
                  className="table-header-cell"
                  style={{ width: "65px" }}
                >{`≥${carton} carton`}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id} hover data-product-id={product.id}>
                <TableCell align="center" className="table-cell">
                  <input
                    type="checkbox"
                    checked={selectedProducts.has(product.id)}
                    onChange={() => toggleProductSelection(product.id)}
                  />
                </TableCell>
                <TableCell
                  align="center"
                  className="product-name-cell table-cell"
                >
                  {product.name.replace(/-/g, "\n")}
                </TableCell>
                <TableCell align="center" className="table-cell">
                  {(() => {
                    if (!selectedProducts.has(product.id)) {
                      return null;
                    }

                    // Get all selected variants for this product
                    const selectedVariants =
                      productVariants[product.id]?.filter((variant) =>
                        selectedFlavors[product.id]?.has(variant.name)
                      ) || [];

                    return (
                      <div className="variant-images-container">
                        {selectedVariants.map(
                          (variant) =>
                            variant.image_url && (
                              <img
                                key={variant.id}
                                src={variant.image_url}
                                alt={`${variant.name} packaging`}
                                className="variant-image"
                                style={{
                                  width: "50px",
                                  height: "50px",
                                  display: "block",
                                  margin: "2px auto",
                                }}
                                crossOrigin="anonymous"
                                loading="eager"
                                onError={(e) => {
                                  console.error(
                                    "Image failed to load:",
                                    e.currentTarget.src
                                  );
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            )
                        )}
                      </div>
                    );
                  })()}
                </TableCell>
                {showPackCount && (
                  <TableCell
                    align="center"
                    className="table-cell"
                    onDoubleClick={() =>
                      handleDoubleClick(
                        product.id,
                        "pack_count_per_box",
                        product.pack_count_per_box.toString()
                      )
                    }
                  >
                    {editingCell?.productId === product.id &&
                    editingCell.field === "pack_count_per_box" ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={handleInputChange}
                        onBlur={() =>
                          handleBlur(product.id, "pack_count_per_box")
                        }
                        onKeyDown={(e) =>
                          handleKeyDown(e, product.id, "pack_count_per_box")
                        }
                        autoFocus
                      />
                    ) : (
                      product.pack_count_per_box
                    )}
                  </TableCell>
                )}
                <TableCell align="center" className="table-cell">
                  {productVariants[product.id]?.length > 0 ? (
                    productVariants[product.id].map((flavor) => (
                      <div
                        key={flavor.name}
                        className="flavor-checkbox-container"
                        style={{
                          whiteSpace: "normal", // Changed from 'nowrap'
                          display: "flex",
                          alignItems: "flex-start",
                          margin: "4px 0",
                        }}
                      >
                        <input
                          type="checkbox"
                          id={`flavor-checkbox-${product.id}-${flavor.name}`}
                          checked={
                            selectedFlavors[product.id]?.has(flavor.name) ||
                            false
                          }
                          onChange={() =>
                            toggleFlavorSelection(product.id, flavor.name)
                          }
                          disabled={!selectedProducts.has(product.id)}
                          style={{ marginTop: "3px" }}
                        />
                        <label
                          htmlFor={`flavor-checkbox-${product.id}-${flavor.name}`}
                          className="flavor-label"
                          style={{
                            marginLeft: "4px",
                            wordBreak: "break-word",
                            textAlign: "left",
                          }}
                        >
                          {flavor.name}
                        </label>
                      </div>
                    ))
                  ) : (
                    <span>No variants</span>
                  )}
                </TableCell>
                {Array.from(visibleCartonColumns).map((carton) => (
                  <TableCell
                    key={carton}
                    align="center"
                    className="table-cell"
                    onDoubleClick={() =>
                      handleDoubleClick(
                        product.id,
                        `price_${carton}`,
                        productPriceTiers[product.id]
                          ?.find((tier) => tier.min_cartons === carton)
                          ?.price_per_unit.toString() || ""
                      )
                    }
                  >
                    {editingCell?.productId === product.id &&
                    editingCell.field === `price_${carton}` ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur(product.id, `price_${carton}`)}
                        onKeyDown={(e) =>
                          handleKeyDown(e, product.id, `price_${carton}`)
                        }
                        autoFocus
                      />
                    ) : (
                      productPriceTiers[product.id]?.find(
                        (tier) => tier.min_cartons === carton
                      )?.price_per_unit || "N/A"
                    )}
                  </TableCell>
                ))}
                {showRetailPrice && (
                  <TableCell
                    align="center"
                    className="table-cell"
                    onDoubleClick={() =>
                      handleDoubleClick(
                        product.id,
                        "recommended_retail_price",
                        product.recommended_retail_price.toString()
                      )
                    }
                  >
                    {editingCell?.productId === product.id &&
                    editingCell.field === "recommended_retail_price" ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={handleInputChange}
                        onBlur={() =>
                          handleBlur(product.id, "recommended_retail_price")
                        }
                        onKeyDown={(e) =>
                          handleKeyDown(
                            e,
                            product.id,
                            "recommended_retail_price"
                          )
                        }
                        autoFocus
                      />
                    ) : product.recommended_retail_price ? (
                      `$${parseFloat(product.recommended_retail_price).toFixed(
                        2
                      )}`
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <div className="footer-container">
        <TextField
          multiline
          fullWidth
          variant="outlined"
          value={footerText}
          onChange={(e) => setFooterText(e.target.value)}
          minRows={4}
          className="footer-text"
        />
      </div>

      <div className="button-container">
        <Button
          variant="contained"
          color="secondary"
          onClick={() => setIsPriceTierModalOpen(true)}
          className="action-button price-tier-button"
          disabled={isGeneratingPDF}
        >
          Price Tier
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={async () => {
            try {
              setIsGeneratingPDF(true);
              // Create the data object for PDF generation
              const pdfData = {
                selectedProducts: Array.from(selectedProducts),
                selectedFlavors: Object.fromEntries(
                  Object.entries(selectedFlavors).map(([key, value]) => [
                    key,
                    Array.from(value),
                  ])
                ),
                products: products.map((product) => ({
                  ...product,
                  variants: productVariants[product.id] || [],
                  priceTiers: productPriceTiers[product.id] || [],
                })),
                companyInfo,
                customerCompanyName,
                currentDate,
                tableSettings: {
                  showPackCount,
                  showRetailPrice,
                  visibleCartonColumns: Array.from(visibleCartonColumns),
                },
                footer: footerText,
              };

              console.log("PDF Data:", JSON.stringify(pdfData, null, 2));

              // Call the backend service
              const pdfBlob = await generateQuotationPDF(
                pdfData as QuotationPDFData
              );
              console.log("PDF generated successfully");

              // Create a blob URL and trigger download
              const blobUrl = URL.createObjectURL(pdfBlob);
              const link = document.createElement("a");
              link.href = blobUrl;
              link.download = `quotation-${customerCompanyName}-${currentDate}.pdf`;
              link.click();

              // Clean up the blob URL after download
              URL.revokeObjectURL(blobUrl);
            } catch (error) {
              console.error("Error generating PDF:", error);
              // You might want to add some error handling UI here
            } finally {
              setIsGeneratingPDF(false);
            }
          }}
          className={`action-button generate-pdf-button ${
            !customerCompanyName ? "disabled" : ""
          }`}
          disabled={!customerCompanyName || isGeneratingPDF}
        >
          {isGeneratingPDF ? (
            <>
              <span className="loading-spinner"></span>
              Generating...
            </>
          ) : (
            "Generate PDF"
          )}
        </Button>
      </div>
      <PriceTierModal
        open={isPriceTierModalOpen}
        onClose={() => setIsPriceTierModalOpen(false)}
        products={products}
        productPriceTiers={productPriceTiers}
        onPriceTierUpdate={handlePriceTierUpdate}
      />
    </div>
  );
};
