import { Product, ProductVariant } from '../../../shared/types/Product';
import { CompanyData } from '../../../shared/types/companyType';

interface GiftSuggestionData {
  name: string;
  description: string;
  pax: number;
  pricePerBox: string;
  total: string;
  selectedProducts: Array<{
    name: string;
    price?: number;
  }>;
  variants: Array<{
    name: string;
    image_url: string | null;
    productName: string;
  }>;
  tierPricing: Array<{
    minQuantity: number;
    maxQuantity: number;
    pricePerUnit: number;
  }>;
  giftBoxType?: {
    id: string;
    name: string;
    image_url: string;
  };
  specialInstructions?: string;
}

interface FormInputs {
  pax: string;
  pricePerPerson: string;
  dietaryRestriction: 'halal' | 'non-halal';
  specialInstructions: string;
}

/**
 * Transform Gift Suggestion data to exactly match the quotation PDF format
 * This ensures the PDF will be identical to the existing quotation system
 */
export const transformGiftSuggestionToQuotation = (
  giftData: GiftSuggestionData,
  companyInfo: CompanyData | null,
  formInputs: FormInputs,
  products: Product[],
  productVariants: { [key: number]: ProductVariant[] },
  customerCompanyName: string = "Gift Box Customer",
  salesManager: string = "Sales Representative"
) => {
  // Get current date in the exact format used by quotations
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  // Use Product ID 78 ("The Kettle Gourmet Gift Box") for the quotation
  const GIFT_BOX_PRODUCT_ID = 78;
  const selectedProducts = [GIFT_BOX_PRODUCT_ID];

  // Build selectedFlavors using the ACTUAL flavors from the gift suggestion
  const selectedFlavors: { [key: string]: string[] } = {};

  // Map the generated gift flavors (truncate if needed)
  const flavorNames = giftData.variants
    .filter(variant => variant.image_url !== null && variant.image_url !== undefined)
    .map(variant => {
      // Truncate long flavor names to prevent column overflow
      let name = variant.name;
      if (name.length > 20) {
        name = name.substring(0, 17) + '...';
      }
      return name;
    });

  selectedFlavors[GIFT_BOX_PRODUCT_ID.toString()] = flavorNames;

  // Find the gift box product or create a placeholder
  const giftBoxProduct = products.find(p => p.id === GIFT_BOX_PRODUCT_ID);

  // Create price tiers based on gift suggestion tier pricing
  const priceTiers = giftData.tierPricing.map((tier, index) => ({
    min_cartons: tier.minQuantity,
    price_per_unit: tier.pricePerUnit.toFixed(2),
    id: index + 1,
    product_id: GIFT_BOX_PRODUCT_ID,
    created_at: new Date().toISOString()
  }));

  // Build the product entry using ACTUAL flavor variants from the gift data
  const quotationProducts = [{
    name: 'Gift Box', // Generic name - specific type will show via giftBoxConfiguration
    description: giftData.description,
    pack_count_per_box: 6, // Gift boxes: 6 boxes per carton as per requirement
    recommended_retail_price: giftData.pricePerBox,
    id: GIFT_BOX_PRODUCT_ID,
    company_id: giftBoxProduct?.company_id || '1',
    created_at: giftBoxProduct?.created_at || new Date().toISOString(),
    image_url: giftData.giftBoxType?.image_url, // Add gift box packaging image
    variants: giftData.variants
      .filter(variant => variant.image_url !== null && variant.image_url !== undefined)
      .map((variant, index) => {
        // Apply same truncation logic as selectedFlavors to ensure matching
        let truncatedName = variant.name;
        if (truncatedName.length > 20) {
          truncatedName = truncatedName.substring(0, 17) + '...';
        }
        return {
          name: truncatedName,
          image_url: variant.image_url || '', // Use the actual flavor image
          id: index + 1,
          product_id: GIFT_BOX_PRODUCT_ID,
          created_at: new Date().toISOString()
        };
      }),
    priceTiers
  }];

  // Create table settings for the quotation - customize for gift suggestions
  const paxNumber = parseInt(formInputs.pax);

  // For gift suggestions, we want a simple table showing:
  // - Product name
  // - Flavors
  // - Number of boxes (pax)
  // - Total price
  // No RRP column, no price per unit columns
  const visibleCartonColumns = []; // Empty to hide carton price columns

  // Standard quotation footer text with gift suggestion specific info
  const footer = `*Gift Suggestion Details:
• Boxes Wanted: ${paxNumber} boxes
• Total Price: RM ${giftData.total}
• Selected Flavors: ${giftData.variants?.length || 0} varieties

*Remarks:
1. All prices above are subject to prevailing GST
2. All goods sold are not returnable
3. Custom gift box configuration as per selection
4. FREE delivery to ONE location, $8 delivery fee to every subsequent location
5. Validity of Quotation: 30 days

${giftData.specialInstructions ? `Special Instructions: ${giftData.specialInstructions}` : ''}`;

  // Build selectedProducts structure for giftBoxConfiguration
  // Group variants by their product to match backend expectations
  const giftBoxSelectedProducts: { [key: string]: { selectedVariants: string[] } } = {};

  if (giftData.giftBoxType && giftData.variants && giftData.variants.length > 0) {
    // For gift suggestions, all variants belong to product ID 78
    giftBoxSelectedProducts[GIFT_BOX_PRODUCT_ID.toString()] = {
      selectedVariants: giftData.variants
        .filter(variant => variant.image_url !== null && variant.image_url !== undefined)
        .map(variant => {
          // Use same truncation as selectedFlavors for consistency
          let name = variant.name;
          if (name.length > 20) {
            name = name.substring(0, 17) + '...';
          }
          return name;
        })
    };
  }

  // Build the exact quotation structure
  const quotationData = {
    selectedProducts,
    selectedFlavors,
    products: quotationProducts,
    // Add giftBoxConfiguration to trigger backend's special gift box layout
    giftBoxConfiguration: giftData.giftBoxType ? {
      name: giftData.giftBoxType.name,
      image_url: giftData.giftBoxType.image_url,
      selectedProducts: giftBoxSelectedProducts // Properly structured with variants
    } : undefined,
    companyInfo: companyInfo ? {
      name: companyInfo.name || "The Kettle Gourmet",
      completed_sign_up_sequence: companyInfo.completed_sign_up_sequence || false,
      company_brand_color: companyInfo.company_brand_color || "#000000",
      id: companyInfo.id || "default-company-id",
      created_at: companyInfo.created_at || new Date().toISOString(),
      address: companyInfo.address || "Singapore",
      website_url: companyInfo.website_url || "www.thekettlegourmet.com",
      phone: companyInfo.phone || "+65 8020 0741",
      logo_url: companyInfo.logo_url || ""
    } : {
      name: "The Kettle Gourmet",
      completed_sign_up_sequence: false,
      company_brand_color: "#000000",
      id: "default-company-id",
      created_at: new Date().toISOString(),
      address: "Singapore",
      website_url: "www.thekettlegourmet.com",
      phone: "+65 8020 0741",
      logo_url: ""
    },
    customerCompanyName,
    currentDate,
    sales_account_manager: salesManager,
    tableSettings: {
      showPackCount: false, // Hide pack count per box
      showRetailPrice: false, // Hide RRP column
      visibleCartonColumns, // Empty array hides price per unit columns
      // Custom settings for gift suggestions
      showGiftSuggestionColumns: true,
      giftSuggestionData: {
        totalPrice: parseFloat(giftData.total),
        numberOfBoxes: paxNumber,
        pricePerBox: parseFloat(giftData.pricePerBox)
      }
    },
    footer: footer.trim(),
    // Additional gift-specific metadata (won't affect PDF but useful for debugging)
    _giftSuggestionMeta: {
      originalGiftData: giftData,
      formInputs,
      totalQuantity: paxNumber,
      dietaryRestriction: formInputs.dietaryRestriction,
      generatedAt: new Date().toISOString()
    }
  };

  return quotationData;
};