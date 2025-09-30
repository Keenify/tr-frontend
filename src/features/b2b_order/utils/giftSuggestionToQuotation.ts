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

  // Find the actual products from the cache that match the gift suggestions
  const giftBoxProducts = products.filter(product =>
    product.name.toLowerCase().includes('gift box')
  );

  // Build selectedProducts array with actual product IDs
  const selectedProducts = giftBoxProducts.map(product => product.id).slice(0, 2);

  // Build selectedFlavors mapping - group variants by product ID
  const selectedFlavors: { [key: string]: string[] } = {};

  giftBoxProducts.slice(0, 2).forEach(product => {
    const productVariantsList = productVariants[product.id] || [];

    // Get the variants that match the generated gift suggestion (exclude null images)
    const matchingVariants = giftData.variants
      .filter(giftVariant =>
        giftVariant.image_url !== null &&
        giftVariant.image_url !== undefined &&
        productVariantsList.some(pv => pv.name === giftVariant.name)
      )
      .map(giftVariant => {
        // Truncate long flavor names to prevent column overflow
        let name = giftVariant.name;
        if (name.length > 20) {
          name = name.substring(0, 17) + '...';
        }
        return name;
      });

    // If we have matching variants, use them; otherwise use first 8 variants from product
    if (matchingVariants.length > 0) {
      selectedFlavors[product.id.toString()] = matchingVariants.slice(0, 8);
    } else {
      selectedFlavors[product.id.toString()] = productVariantsList
        .slice(0, 8)
        .map(variant => {
          // Truncate long flavor names to prevent column overflow
          let name = variant.name;
          if (name.length > 20) {
            name = name.substring(0, 17) + '...';
          }
          return name;
        });
    }
  });

  // Build products array with variants and pricing tiers
  const quotationProducts = giftBoxProducts.slice(0, 2).map(product => {
    const variants = productVariants[product.id] || [];

    // Create price tiers based on gift suggestion tier pricing
    const priceTiers = giftData.tierPricing.map((tier, index) => ({
      min_cartons: tier.minQuantity,
      price_per_unit: tier.pricePerUnit.toFixed(2),
      id: index + 1,
      product_id: product.id,
      created_at: new Date().toISOString()
    }));

    return {
      name: product.name,
      description: product.description,
      pack_count_per_box: 6, // Gift boxes: 6 boxes per carton as per requirement
      recommended_retail_price: giftData.pricePerBox,
      id: product.id,
      company_id: product.company_id,
      created_at: product.created_at,
      variants: variants
        .filter(variant => variant.image_url !== null && variant.image_url !== undefined)
        .map(variant => ({
          name: variant.name,
          image_url: variant.image_url || '', // Ensure it's never null
          id: variant.id,
          product_id: variant.product_id,
          created_at: variant.created_at
        })),
      priceTiers
    };
  });

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

  // Build the exact quotation structure
  const quotationData = {
    selectedProducts,
    selectedFlavors,
    products: quotationProducts,
    companyInfo: companyInfo ? {
      name: companyInfo.name,
      completed_sign_up_sequence: companyInfo.completed_sign_up_sequence || false,
      company_brand_color: companyInfo.company_brand_color,
      id: companyInfo.id,
      created_at: companyInfo.created_at,
      address: companyInfo.address,
      website_url: companyInfo.website_url,
      phone: companyInfo.phone,
      logo_url: companyInfo.logo_url
    } : {
      name: "The Kettle Gourmet",
      completed_sign_up_sequence: false,
      company_brand_color: null,
      id: "default-company-id",
      created_at: new Date().toISOString(),
      address: "Singapore",
      website_url: "www.thekettlegourmet.com",
      phone: "+65 8020 0741",
      logo_url: null
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