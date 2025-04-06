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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
} from "@mui/material";
import { Session } from "@supabase/supabase-js";
import React from "react";
import PriceTierModal from "./PriceTierModal";
import GiftBoxModal from "./GiftBoxModal";
import { getProductsByCompany } from "../../../services/useProducts";
import { getProductPriceTiers } from "../services/useProductsPriceTier";
import { getProductVariants } from "../../../services/useProductVariants";
import { generateQuotationPDF } from "../services/useQuotationPDF";
import { useUserAndCompanyData } from "../../../shared/hooks/useUserAndCompanyData";
import { Product, ProductPriceTier } from "../../../shared/types/Product";
import { GiftBoxConfiguration, QuotationPDFData } from "../types/QuotationPDF";
import "../styles/Quotation.css";
import { BranchInfo, CompanyData } from '../../../shared/types/companyType';
import EditIcon from '@mui/icons-material/Edit';

interface QuotationB2BProps {
  session: Session;
  branch: 'SG' | 'MY';
  companyInfo: CompanyData;
  branchInfo: BranchInfo;
}

export const QuotationB2B: React.FC<QuotationB2BProps> = ({ 
  session, 
  branch,
  companyInfo,
  branchInfo
}) => {
  const { companyInfo: userCompanyInfo, error } = useUserAndCompanyData(session.user.id);
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
    month: "long",
    year: "numeric",
  });

  // Add new state for gift box
  const [isGiftBox, setIsGiftBox] = React.useState<boolean>(false);

  // Add sales account manager state
  const [salesAccountManager, setSalesAccountManager] = React.useState<string>("");

  // Add new state for toggling between carton and pack count
  const [displayPackCount, setDisplayPackCount] = React.useState<boolean>(false);

  // Update the currency state to use branch
  const [selectedCurrency, setSelectedCurrency] = React.useState<'SGD' | 'MYR'>(branch === 'SG' ? 'SGD' : 'MYR');

  // State for input errors
  const [customerNameError, setCustomerNameError] = React.useState<boolean>(false);
  const [salesManagerError, setSalesManagerError] = React.useState<boolean>(false);

  // Refs for input fields
  const customerNameRef = React.useRef<HTMLInputElement>(null);
  const salesManagerRef = React.useRef<HTMLInputElement>(null);

  // Add effect to update currency when branch changes
  React.useEffect(() => {
    setSelectedCurrency(branch === 'SG' ? 'SGD' : 'MYR');
  }, [branch]);

  // Update the initial footer text state to be a function that considers gift box status
  const getFooterText = (includeGiftBox: boolean) => {
    const giftBoxContent = `Content Per Gift Box:
3 x 30g Assorted Flavoured Popcorn
2 x 35g Brownie Crisps
1 x 50g Crispy Cones
1 x 20 pcs YUMI Corn Sticks

`;

    const remarks = `*Remarks:
1. All prices above are subject to prevailing GST
2. All goods sold are not returnable
3. Mixing of products within the same carton is not allowed
4. Discount is applicable to same product category
5. FREE delivery to ONE location, $8 delivery fee to every subsequent location
6. Validity of Quotation: 30 days from quotation date shown above`;

    return includeGiftBox ? giftBoxContent + remarks : remarks;
  };

  const [footerText, setFooterText] = React.useState<string>(() => getFooterText(false));

  // Add effect to update footer text when gift box status changes
  React.useEffect(() => {
    setFooterText(getFooterText(isGiftBox));
  }, [isGiftBox]);

  // Add a ref to track initial render for price tier headers
  const initialRenderRef = React.useRef(true);

  React.useEffect(() => {
    if (userCompanyInfo?.id) {
      setLoadingProducts(true);
      getProductsByCompany(userCompanyInfo.id)
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
  }, [userCompanyInfo?.id]);

  // Function to get unique price tier headers for the table
  const getPriceTierHeaders = React.useCallback(() => {
    const allTiers = Object.values(productPriceTiers)
      .flat()
      .filter(tier => tier.currency === selectedCurrency); // Filter by selected currency
    
    if (displayPackCount) {
      const uniquePacks = Array.from(
        new Set(allTiers.map((tier) => tier.min_packs))
      );
      return uniquePacks
        .filter((pack): pack is number => pack !== null && pack > 0)
        .sort((a, b) => a - b);
    } else {
      const uniqueCartons = Array.from(
        new Set(allTiers.map((tier) => tier.min_cartons))
      );
      return uniqueCartons
        .filter((carton): carton is number => carton !== null && carton > 0)
        .sort((a, b) => a - b);
    }
  }, [productPriceTiers, displayPackCount, selectedCurrency]);

  const priceTierHeaders = React.useMemo(
    () => getPriceTierHeaders(),
    [getPriceTierHeaders]
  );

  // Update the useEffect to initialize visible columns only on first render
  React.useEffect(() => {
    // Only initialize on first render
    if (initialRenderRef.current) {
      setVisibleCartonColumns(new Set(priceTierHeaders));
      initialRenderRef.current = false;
    }
  }, [priceTierHeaders]); // Add priceTierHeaders as dependency

  // Separate effect to handle display toggle changes
  React.useEffect(() => {
    // Only run this effect after initial render
    if (!initialRenderRef.current) {
      const updatedHeaders = getPriceTierHeaders();
      // When toggling between display modes, we want to keep the user's selections
      // as much as possible while adapting to the new price tier structure
      setVisibleCartonColumns(prev => {
        // Create a new set to store the updated columns
        const newSet = new Set<number>();
        
        // If user had checked all columns, keep all checked
        if (prev.size === priceTierHeaders.length) {
          return new Set(updatedHeaders);
        }
        
        // If user had unchecked all columns, keep all unchecked
        if (prev.size === 0) {
          return new Set<number>();
        }
        
        // For other cases, try to preserve the user's selection pattern
        // by matching relative positions rather than exact values
        updatedHeaders.forEach(header => {
          // If this price tier existed in the previous view and was checked, check it in the new view
          if (priceTierHeaders.includes(header) && prev.has(header)) {
            newSet.add(header);
          }
        });
        
        return newSet;
      });
    }
  }, [displayPackCount, getPriceTierHeaders, priceTierHeaders]); // Add the missing dependencies

  // Update the useEffect to check for gift box products
  React.useEffect(() => {
    const hasGiftBoxProduct = Array.from(selectedProducts).some(productId => {
      const product = products.find(p => p.id === productId);
      return product?.name.toLowerCase().includes('gift box');
    });
    setIsGiftBox(hasGiftBoxProduct);
  }, [selectedProducts, products]);

  // Function to toggle product selection
  const toggleProductSelection = (productId: number) => {
    setSelectedProducts((prev) => {
      const newSelection = new Set(prev);
      const product = products.find(p => p.id === productId);
      const isGiftBox = product?.name.toLowerCase().includes('gift box');

      if (newSelection.has(productId)) {
        newSelection.delete(productId);
        setSelectedFlavors((prevFlavors) => {
          const newFlavors = { ...prevFlavors };
          newFlavors[productId] = new Set(); // Deselect all flavors
          return newFlavors;
        });
        
        // Clear gift box configuration if gift box is deselected
        if (isGiftBox) {
          setGiftBoxConfiguration(null);
        }
      } else {
        newSelection.add(productId);
        setSelectedFlavors((prevFlavors) => {
          const newFlavors = { ...prevFlavors };
          // If it's a gift box product, initialize with empty selection
          // Otherwise, select all flavors as before
          newFlavors[productId] = isGiftBox 
            ? new Set() 
            : new Set(productVariants[productId]?.map((variant) => variant.name) || []);
          return newFlavors;
        });
      }

      // Check if any selected product contains "gift box"
      const selectedProductsList = Array.from(newSelection);
      const hasGiftBoxProduct = selectedProductsList.some(id => {
        const product = products.find(p => p.id === id);
        return product?.name.toLowerCase().includes('gift box');
      });
      setIsGiftBox(hasGiftBoxProduct);

      return newSelection;
    });
  };

  // Function to toggle flavor selection for a given product
  const toggleFlavorSelection = (productId: number, flavor: string) => {
    const product = products.find(p => p.id === productId);
    const isGiftBox = product?.name.toLowerCase().includes('gift box');

    setSelectedFlavors((prev) => {
      const newFlavors = { ...prev };
      if (!newFlavors[productId]) {
        newFlavors[productId] = new Set();
      }

      // For gift box products, only allow one flavor to be selected
      if (isGiftBox) {
        // Clear any previously selected flavors
        newFlavors[productId] = new Set();
        
        // Add the new flavor if it wasn't already selected
        if (!newFlavors[productId].has(flavor)) {
          newFlavors[productId].add(flavor);
        }
      } else {
        // For non-gift box products, use the original toggle behavior
        if (newFlavors[productId].has(flavor)) {
          newFlavors[productId] = new Set(newFlavors[productId]); // Create a new Set to ensure state change
          newFlavors[productId].delete(flavor); // Uncheck flavor
        } else {
          newFlavors[productId] = new Set(newFlavors[productId]); // Create a new Set to ensure state change
          newFlavors[productId].add(flavor); // Check flavor
        }
      }
      
      return newFlavors;
    });
  };

  // Function to handle double-click to edit
  const handleDoubleClick = (
    productId: number,
    field: string,
    value: string | number | null | undefined // Allow different types
  ) => {
    setEditingCell({ productId, field });
    // If value is null, undefined, or "N/A", start with an empty input
    setEditValue(value === null || value === undefined || value === "N/A" ? "" : String(value));
  };

  // Function to handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  // Function to handle input blur (save changes)
  const handleBlur = (productId: number, field: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const currentTiers = productPriceTiers[productId] || [];
    let updatedTiers = [...currentTiers]; // Create a copy to modify

    if (field.startsWith("price_")) {
      let foundTier = false;
      const parsedValue = parseFloat(editValue); // Try parsing the input value
      const isValidNumber = !isNaN(parsedValue) && editValue.trim() !== "";

      if (field.startsWith("price_pack_")) { // Handle pack prices first
        const pack = parseInt(field.split("_")[2], 10);
        updatedTiers = currentTiers.map((tier) => {
          if (tier.min_packs === pack && tier.currency === selectedCurrency) {
            foundTier = true;
            // Only update if editValue is a valid number
            return { ...tier, price_per_unit: isValidNumber ? String(parsedValue) : tier.price_per_unit };
          }
          return tier;
        });

        // If no existing tier was found and editValue is a valid number, create a new one
        if (!foundTier && isValidNumber) {
          const newTier: ProductPriceTier = {
            id: -1, // Temporary ID
            created_at: new Date().toISOString(), // Temporary timestamp
            product_id: productId,
            min_cartons: null,
            min_packs: pack,
            price_per_unit: String(parsedValue),
            currency: selectedCurrency,
          };
          updatedTiers.push(newTier);
        }

      } else { // Handle carton prices
        const carton = parseInt(field.split("_")[1], 10);
        updatedTiers = currentTiers.map((tier) => {
          if (tier.min_cartons === carton && tier.currency === selectedCurrency) {
            foundTier = true;
            // Only update if editValue is a valid number
            return { ...tier, price_per_unit: isValidNumber ? String(parsedValue) : tier.price_per_unit };
          }
          return tier;
        });

        // If no existing tier was found and editValue is a valid number, create a new one
        if (!foundTier && isValidNumber) {
           const newTier: ProductPriceTier = {
            id: -1, // Temporary ID
            created_at: new Date().toISOString(), // Temporary timestamp
            product_id: productId,
            min_cartons: carton,
            min_packs: null,
            price_per_unit: String(parsedValue),
            currency: selectedCurrency,
          };
          updatedTiers.push(newTier);
        }
      }

      // Only update state if a change occurred or a new tier was added
      if (foundTier || (!foundTier && isValidNumber)) {
          setProductPriceTiers((prev) => ({
            ...prev,
            [productId]: updatedTiers,
          }));
      }

    } else {
      // Handle other fields like pack_count_per_box
      setProducts((prevProducts) =>
        prevProducts.map((p) => {
          if (p.id === productId) {
            // Only update if editValue is a valid number for numeric fields
            const newValue = (field === "pack_count_per_box" && (isNaN(parseInt(editValue)) || editValue.trim() === "")) ? p[field] : editValue;
            return { ...p, [field]: newValue };
          }
          return p;
        })
      );
    }

    setEditingCell(null);
    setEditValue(""); // Reset edit value
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

  // Replace old gift box states with new configuration
  const [isGiftBoxModalOpen, setIsGiftBoxModalOpen] = React.useState<boolean>(false);
  const [giftBoxConfiguration, setGiftBoxConfiguration] = React.useState<GiftBoxConfiguration | null>(null);

  // Remove the old gift box item functions and add these new ones
  const handleOpenGiftBoxModal = () => {
    setIsGiftBoxModalOpen(true);
  };

  const handleCloseGiftBoxModal = () => {
    setIsGiftBoxModalOpen(false);
  };

  const handleSaveGiftBoxConfiguration = (config: GiftBoxConfiguration) => {
    // Check if we have a gift box product that's already selected
    const giftBoxProductIds = Array.from(selectedProducts).filter(productId => {
      const product = products.find(p => p.id === productId);
      return product?.name.toLowerCase().includes('gift box');
    });

    if (giftBoxProductIds.length > 0) {
      // We have a gift box product selected
      const giftBoxProductId = giftBoxProductIds[0];
      const selectedFlavorsList = Array.from(selectedFlavors[giftBoxProductId] || []);
      
      // If we have a selected flavor, use it as the name
      if (selectedFlavorsList.length > 0) {
        config.name = selectedFlavorsList[0];
        
        // Also get the product name for the description
        const giftBoxProduct = products.find(p => p.id === giftBoxProductId);
        if (giftBoxProduct) {
          config.description = giftBoxProduct.name;
        }
      }
    }
    
    setGiftBoxConfiguration(config);
  };

  // Update PDF data to include gift box configuration
  const handleGeneratePDF = async () => {
    // Check if at least one product is selected
    if (selectedProducts.size === 0) {
        alert("Please select at least one product before generating the PDF.");
        return; // Stop PDF generation
    }

    // Reset errors
    setCustomerNameError(false);
    setSalesManagerError(false);

    let hasError = false;
    if (!customerCompanyName.trim()) {
        setCustomerNameError(true);
        customerNameRef.current?.focus();
        hasError = true;
    }
    if (!salesAccountManager.trim()) {
        setSalesManagerError(true);
        // Only focus sales manager if customer name is not already focused
        if (!hasError) {
            salesManagerRef.current?.focus();
        }
        hasError = true;
    }

    if (hasError) {
        return; // Stop PDF generation if there are errors
    }

    // Check if more than 3 price columns are selected
    if (visibleCartonColumns.size > 3) {
      const confirm = window.confirm(
        "Warning: Selecting more than 3 price columns may cause PDF layout issues. Do you want to continue?"
      );
      if (!confirm) {
        return;
      }
    }

    try {
      setIsGeneratingPDF(true);
      
      // If we have a gift box product, make sure to use the selected flavor as the name
      let finalGiftBoxConfig = giftBoxConfiguration;
      
      if (isGiftBox) {
        // Find the gift box product
        const giftBoxProductIds = Array.from(selectedProducts).filter(productId => {
          const product = products.find(p => p.id === productId);
          return product?.name.toLowerCase().includes('gift box');
        });
        
        if (giftBoxProductIds.length > 0) {
          const giftBoxProductId = giftBoxProductIds[0];
          const selectedFlavorsList = Array.from(selectedFlavors[giftBoxProductId] || []);
          
          // If we have a selected flavor, use it as the name
          if (selectedFlavorsList.length > 0 && finalGiftBoxConfig) {
            finalGiftBoxConfig = {
              ...finalGiftBoxConfig,
              name: selectedFlavorsList[0]
            };
            
            // Also update the description if needed
            const giftBoxProduct = products.find(p => p.id === giftBoxProductId);
            if (giftBoxProduct) {
              finalGiftBoxConfig.description = giftBoxProduct.name;
            }
          }
        }
      }
      
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
        companyInfo: {
          ...companyInfo,
          name: branchInfo.name,
          phone: branchInfo.phone,
          address: branchInfo.address
        },
        customerCompanyName,
        sales_account_manager: salesAccountManager,
        currentDate,
        currency: selectedCurrency,
        tableSettings: {
          showPackCount,
          showRetailPrice,
          visibleCartonColumns: Array.from(visibleCartonColumns),
          displayType: displayPackCount ? 'pack' : 'carton',
        },
        footer: footerText,
        giftBoxConfiguration: isGiftBox ? finalGiftBoxConfig : undefined,
      };

      console.log("PDF Data:", JSON.stringify(pdfData, null, 2));

      const pdfBlob = await generateQuotationPDF(pdfData as QuotationPDFData);
      console.log("PDF generated successfully");

      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = blobUrl;
      // Format date as YYYY-MM-DD for the filename
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
      const day = String(now.getDate()).padStart(2, '0');
      const formattedDateForFilename = `${year}-${month}-${day}`;
      link.download = `Quotation - ${customerCompanyName} (${formattedDateForFilename}).pdf`;
      link.click();

      // URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Function to toggle the visibility of carton columns
  const toggleCartonColumn = (carton: number) => {
    setVisibleCartonColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(carton)) {
        newSet.delete(carton);
      } else {
        newSet.add(carton);
      }
      return newSet;
    });
  };

  // Add or update the CSS styles in your Quotation.css file
  const toggleContainerStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)', // Creates 2 columns
    gap: '10px',
    padding: '15px',
    width: '100%'
  };

  const toggleLabelStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    whiteSpace: 'nowrap'
  };

  if (loadingProducts) {
    return <div>Loading products...</div>;
  }

  if (error || fetchError) {
    return <div>Error: {error?.message || fetchError}</div>;
  }

  return (
    <div className="quotation-container">
      {/* Customer Info and Settings Header */}
      <Grid container spacing={2} className="customer-info-container">
        <Grid item xs={6}>
          <TextField
            label="Customer Company Name"
            variant="outlined"
            fullWidth
            value={customerCompanyName}
            onChange={(e) => setCustomerCompanyName(e.target.value)}
            placeholder="Enter client company name"
            style={{ marginBottom: '1rem' }}
            inputRef={customerNameRef}
            error={customerNameError}
            helperText={customerNameError ? "Customer name is required" : ""}
            onFocus={() => setCustomerNameError(false)} // Clear error on focus
          />
          <TextField
            label="Sales Account Manager"
            variant="outlined"
            fullWidth
            value={salesAccountManager}
            onChange={(e) => setSalesAccountManager(e.target.value)}
            placeholder="Enter sales account manager name"
            inputRef={salesManagerRef}
            error={salesManagerError}
            helperText={salesManagerError ? "Sales manager name is required" : ""}
            onFocus={() => setSalesManagerError(false)} // Clear error on focus
          />
          <FormControl 
            variant="outlined" 
            fullWidth 
            style={{ marginTop: '1rem' }}
          >
            <InputLabel>Currency</InputLabel>
            <Select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value as 'SGD' | 'MYR')}
              label="Currency"
            >
              <MenuItem value="SGD">SGD</MenuItem>
              <MenuItem value="MYR">MYR</MenuItem>
            </Select>
          </FormControl>
          <div className="date-container">Updated At: {currentDate}</div>
        </Grid>

        <Grid item xs={6}>
          <div className="toggle-container" style={toggleContainerStyles}>
            <label className="toggle-label" style={toggleLabelStyles}>
              <input
                type="checkbox"
                checked={displayPackCount}
                onChange={() => setDisplayPackCount((prev) => !prev)}
              />
              Display Pack Count
            </label>
            <label className="toggle-label" style={toggleLabelStyles}>
              <input
                type="checkbox"
                checked={showPackCount}
                onChange={() => setShowPackCount((prev) => !prev)}
              />
              Show Pack Count Per Box
            </label>
            {priceTierHeaders
              .filter((carton): carton is number => carton !== null)
              .map((carton) => (
                <label key={carton} className="toggle-label" style={toggleLabelStyles}>
                  <input
                    type="checkbox"
                    checked={visibleCartonColumns.has(carton)}
                    onChange={() => toggleCartonColumn(carton)}
                  />
                  {displayPackCount ? `Show ≥${carton} Pack` : `Show ≥${carton} Carton`}
                </label>
              ))}
            <label className="toggle-label" style={toggleLabelStyles}>
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
                style={{ width: "60px", backgroundColor: "#FF9933" }}
              >
                Select
              </TableCell>
              <TableCell
                align="center"
                rowSpan={2}
                className="table-header-cell"
                style={{ width: "15%", backgroundColor: "#FF9933" }}
              >
                Product Name
              </TableCell>
              <TableCell
                align="center"
                rowSpan={2}
                className="table-header-cell"
                style={{ width: "120px", backgroundColor: "#FF9933" }}
              >
                Packaging
              </TableCell>
              {showPackCount && (
                <TableCell
                  align="center"
                  rowSpan={2}
                  className="table-header-cell"
                  style={{ width: "80px", backgroundColor: "#FF9933" }}
                >
                  Pack Count Per Box
                </TableCell>
              )}
              <TableCell
                align="center"
                rowSpan={2}
                className="table-header-cell"
                style={{ width: "15%", backgroundColor: "#FF9933" }}
              >
                Flavour
              </TableCell>
              {visibleCartonColumns.size > 0 && (
                <TableCell
                  align="center"
                  colSpan={visibleCartonColumns.size}
                  className="table-header-cell"
                  style={{ backgroundColor: "#FF9933" }}
                >
                  Price per unit ({selectedCurrency})
                </TableCell>
              )}
              {showRetailPrice && (
                <TableCell
                  align="center"
                  rowSpan={2}
                  className="table-header-cell"
                  style={{ width: "100px", backgroundColor: "#FF9933" }}
                >
                  Recommended Retail Price ({selectedCurrency})
                </TableCell>
              )}
            </TableRow>
            <TableRow>
              {Array.from(visibleCartonColumns).map((count) => (
                <TableCell
                  key={count}
                  align="center"
                  className="table-header-cell"
                  style={{ width: "65px", backgroundColor: "#FF9933" }}
                >
                  {displayPackCount ? `≥${count} pack` : `≥${count} carton`}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => {
              const isProductGiftBox = product.name.toLowerCase().includes('gift box');
              const isSelected = selectedProducts.has(product.id);
              
              return (
                <TableRow key={product.id} hover data-product-id={product.id}>
                  <TableCell align="center" className="table-cell">
                    <input
                      title="Select product"
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleProductSelection(product.id)}
                    />
                  </TableCell>
                  <TableCell
                    align="center"
                    className="product-name-cell table-cell"
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div>{product.name.replace(/-/g, "\n")}</div>
                      
                      {/* Show edit button and configuration summary for selected gift box products */}
                      {isProductGiftBox && isSelected && (
                        <div style={{ marginTop: '8px' }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={handleOpenGiftBoxModal}
                            style={{ fontSize: '0.75rem' }}
                          >
                            {giftBoxConfiguration ? 'Edit Contents' : 'Configure Box'}
                          </Button>
                          
                          {giftBoxConfiguration && (
                            <Box sx={{ mt: 1, maxWidth: '200px', margin: '0 auto' }}>
                              <Typography variant="caption" fontWeight="bold" display="block">
                                {giftBoxConfiguration.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {Object.keys(giftBoxConfiguration.selectedProducts).length} products selected
                              </Typography>
                            </Box>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell align="center" className="table-cell">
                    {(() => {
                      if (!isSelected) {
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
                          placeholder="Enter pack count"
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
                            disabled={!isSelected}
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
                  {Array.from(visibleCartonColumns).map((count) => {
                    const currentPriceTier = productPriceTiers[product.id]
                      ?.find((tier) =>
                        displayPackCount
                          ? tier.min_packs === count && tier.currency === selectedCurrency
                          : tier.min_cartons === count && tier.currency === selectedCurrency
                      );
                    const priceValue = currentPriceTier?.price_per_unit;

                    return (
                      <TableCell
                        key={count}
                        align="center"
                        className="table-cell"
                        onDoubleClick={() =>
                          handleDoubleClick(
                            product.id,
                            displayPackCount ? `price_pack_${count}` : `price_${count}`,
                            priceValue !== undefined ? priceValue : "N/A" // Pass "N/A" if undefined
                          )
                        }
                      >
                        {editingCell?.productId === product.id &&
                        editingCell.field === (displayPackCount ? `price_pack_${count}` : `price_${count}`) ? (
                          <input
                            type="text" // Use text to allow empty input initially and handle potential non-numeric temp values
                            value={editValue}
                            onChange={handleInputChange}
                            onBlur={() =>
                              handleBlur(
                                product.id,
                                displayPackCount ? `price_pack_${count}` : `price_${count}`
                              )
                            }
                            onKeyDown={(e) =>
                              handleKeyDown(
                                e,
                                product.id,
                                displayPackCount ? `price_pack_${count}` : `price_${count}`
                              )
                            }
                            autoFocus
                            placeholder="Enter price"
                            style={{ width: '60px', textAlign: 'center' }} // Added style for better input appearance
                          />
                        ) : (
                          priceValue !== undefined ? priceValue : "N/A" // Display "N/A" if undefined
                        )}
                      </TableCell>
                    );
                  })}
                  {showRetailPrice && (
                    <TableCell
                      align="center"
                      className="table-cell"
                    >
                      {product[selectedCurrency === 'SGD' ? 'rrp_sgd' : 'rrp_myr'] || 'N/A'}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
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

      {/* Price Tier and Generate PDF buttons */}
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
          onClick={handleGeneratePDF}
          className={`action-button generate-pdf-button`} // Removed disabled class logic here
          disabled={isGeneratingPDF} // Only disable when generating
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

      {/* Modals */}
      <PriceTierModal
        open={isPriceTierModalOpen}
        onClose={() => setIsPriceTierModalOpen(false)}
        products={products}
        productPriceTiers={productPriceTiers}
        onPriceTierUpdate={handlePriceTierUpdate}
        selectedCurrency={selectedCurrency}
      />

      <GiftBoxModal
        open={isGiftBoxModalOpen}
        onClose={handleCloseGiftBoxModal}
        products={products}
        productVariants={productVariants}
        giftBoxConfiguration={giftBoxConfiguration}
        onSave={handleSaveGiftBoxConfiguration}
      />
    </div>
  );
};
