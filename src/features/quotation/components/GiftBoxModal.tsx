import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  Chip,
  Box,
  Typography,
  Divider,
  Paper,
  Grid,
} from '@mui/material';
import { Product } from '../../../shared/types/Product';
import { GiftBoxConfiguration } from '../types/QuotationPDF';

interface GiftBoxModalProps {
  open: boolean;
  onClose: () => void;
  products: Product[];
  productVariants: {
    [key: number]: Array<{
      id: number;
      name: string;
      image_url: string | null;
    }>;
  };
  giftBoxConfiguration: GiftBoxConfiguration | null;
  onSave: (config: GiftBoxConfiguration) => void;
}

const GiftBoxModal: React.FC<GiftBoxModalProps> = ({
  open,
  onClose,
  products,
  productVariants,
  giftBoxConfiguration,
  onSave,
}) => {
  // State for selected products and their variants
  const [selectedProducts, setSelectedProducts] = useState<{
    [productId: number]: {
      name: string;
      selectedVariants: string[];
    };
  }>({});

  // Initialize state when modal opens
  useEffect(() => {
    if (open && giftBoxConfiguration) {
      setSelectedProducts(giftBoxConfiguration.selectedProducts);
    } else if (open) {
      setSelectedProducts({});
    }
  }, [open, giftBoxConfiguration]);

  // Handle product selection
  const handleProductSelect = (productId: number) => {
    setSelectedProducts((prev) => {
      const newSelectedProducts = { ...prev };
      const product = products.find(p => p.id === productId);
      const isGiftBox = product?.name.toLowerCase().includes('gift box');
      
      // If product already exists, remove it
      if (newSelectedProducts[productId]) {
        delete newSelectedProducts[productId];
      } else {
        // Add product with appropriate variants
        if (product) {
          const variants = productVariants[productId] || [];
          
          // For gift box, pre-select the first variant if available
          if (isGiftBox && variants.length > 0) {
            newSelectedProducts[productId] = {
              name: product.name,
              selectedVariants: [variants[0].name]
            };
          } else {
            // For other products, start with empty variants
            newSelectedProducts[productId] = {
              name: product.name,
              selectedVariants: []
            };
          }
        }
      }
      
      return newSelectedProducts;
    });
  };

  // Handle variant selection for a product
  const handleVariantSelect = (productId: number, variantName: string) => {
    setSelectedProducts((prev) => {
      const newSelectedProducts = { ...prev };
      const product = products.find(p => p.id === productId);
      const isGiftBox = product?.name.toLowerCase().includes('gift box');
      
      if (!newSelectedProducts[productId]) {
        if (!product) return prev;
        
        newSelectedProducts[productId] = {
          name: product.name,
          selectedVariants: [variantName]
        };
      } else {
        // For gift box products, only allow one flavor to be selected
        if (isGiftBox) {
          const variants = newSelectedProducts[productId].selectedVariants;
          const variantIndex = variants.indexOf(variantName);
          
          if (variantIndex >= 0) {
            // If the user is unchecking the only selected variant, just keep it checked
            // since we require one flavor to be selected
            return newSelectedProducts;
          } else {
            // Replace the existing variants with just the new one
            newSelectedProducts[productId].selectedVariants = [variantName];
          }
        } else {
          // For non-gift box products, use the original toggle behavior
          const variants = newSelectedProducts[productId].selectedVariants;
          const variantIndex = variants.indexOf(variantName);
          
          if (variantIndex >= 0) {
            // Remove variant if already selected
            newSelectedProducts[productId].selectedVariants = [
              ...variants.slice(0, variantIndex),
              ...variants.slice(variantIndex + 1)
            ];
          } else {
            // Add variant
            newSelectedProducts[productId].selectedVariants = [...variants, variantName];
          }
          
          // If no variants selected, remove the product
          if (newSelectedProducts[productId].selectedVariants.length === 0) {
            delete newSelectedProducts[productId];
          }
        }
      }
      
      return newSelectedProducts;
    });
  };

  // Handle save button click
  const handleSave = () => {
    // Find gift box products to get the flavor name
    let giftBoxName = 'Custom Gift Box';
    let giftBoxDescription = 'Custom assortment of products';
    
    // Search through selected products for gift box items
    for (const productId of Object.keys(selectedProducts)) {
      const numericProductId = Number(productId);
      const prod = products.find(p => p.id === numericProductId);
      
      // If this is a gift box product
      if (prod?.name.toLowerCase().includes('gift box')) {
        // Use the product name as the base description
        giftBoxDescription = prod.name;
        
        // Use the selected flavor as the name, if available
        const productData = selectedProducts[numericProductId];
        if (productData.selectedVariants.length > 0) {
          giftBoxName = productData.selectedVariants[0];
        }
        
        // Only use the first gift box product found
        break;
      }
    }

    onSave({
      selectedProducts,
      name: giftBoxName,
      description: giftBoxDescription,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth className="gift-box-modal">
      <DialogTitle>Gift Box Configuration</DialogTitle>
      <DialogContent dividers>
        <Typography variant="h6" gutterBottom>
          Select Products and Flavors for Gift Box
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom>
                Available Products
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {products.map((product) => {
                const isSelected = !!selectedProducts[product.id];
                const variants = productVariants[product.id] || [];
                
                return (
                  <Box key={product.id} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleProductSelect(product.id)}
                        color="primary"
                      />
                      <Typography>{product.name}</Typography>
                    </Box>
                    
                    {isSelected && variants.length > 0 && (
                      <Box sx={{ pl: 4, mt: 1 }}>
                        <Typography variant="body2" gutterBottom>
                          Select Flavors:
                        </Typography>
                        {variants.map((variant) => {
                          const variantSelected = selectedProducts[product.id]?.selectedVariants?.includes(variant.name);
                          
                          return (
                            <Box key={variant.id} sx={{ display: 'flex', alignItems: 'center' }}>
                              <Checkbox
                                checked={variantSelected}
                                onChange={() => handleVariantSelect(product.id, variant.name)}
                                size="small"
                              />
                              <Typography variant="body2">{variant.name}</Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom>
                Selected Products
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {Object.keys(selectedProducts).length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No products selected
                </Typography>
              ) : (
                Object.entries(selectedProducts).map(([productId, product]) => (
                  <Box key={productId} sx={{ mb: 2 }}>
                    <Typography variant="body1" fontWeight="bold">
                      {product.name}
                    </Typography>
                    
                    {product.selectedVariants.length > 0 ? (
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {product.selectedVariants.map((variant, index) => (
                          <Chip
                            key={index}
                            label={variant}
                            size="small"
                            onDelete={() => handleVariantSelect(Number(productId), variant)}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        All flavors
                      </Typography>
                    )}
                  </Box>
                ))
              )}
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSave} color="primary" variant="contained">
          Save Configuration
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GiftBoxModal; 