import { Product, ProductVariant } from '../../../shared/types/Product';
import { filterFlavorVariants } from './giftBoxVariantFilter';
import { GIFT_BOX_TYPES, categorizeVariantsByBrand, BrandCategories, STATIC_PRODUCT_VARIANTS } from './staticProductData';

interface AutomatedGiftBoxConfig {
  pax: number;
  budgetPerPerson: number;
  dietaryRestriction: 'halal' | 'non-halal';
}

interface TierPricing {
  minQuantity: number;
  maxQuantity: number;
  pricePerUnit: number;
}

interface AutomatedGiftBox {
  name: string;
  description: string;
  giftBoxType: {
    id: string;
    name: string;
    image_url: string;
  };
  selectedProducts: {
    [productId: number]: {
      name: string;
      selectedVariants: string[];
      price?: number;
    };
  };
  selectedVariantDetails: ProductVariant[];
  brandCategories: {
    bronys: ProductVariant[];
    kettleGourmet: ProductVariant[];
    yumiCurls: ProductVariant[];
    yumiSticks: ProductVariant[];
  };
  totalPrice: number;
  pricePerBox: number;
  actualPricePerBox: number;
  tierPricing: TierPricing[];
  quantity: number;
  priceBreakdown?: {
    baseCost: number;
    markup: number;
    discount: number;
  };
}

const DEFAULT_TIER_PRICING: TierPricing[] = [
  { minQuantity: 1, maxQuantity: 49, pricePerUnit: 1.0 },
  { minQuantity: 50, maxQuantity: 99, pricePerUnit: 0.95 },
  { minQuantity: 100, maxQuantity: 199, pricePerUnit: 0.90 },
  { minQuantity: 200, maxQuantity: 499, pricePerUnit: 0.85 },
  { minQuantity: 500, maxQuantity: Infinity, pricePerUnit: 0.80 },
];

export const calculateTierPrice = (
  basePrice: number,
  quantity: number,
  tiers: TierPricing[] = DEFAULT_TIER_PRICING
): number => {
  const applicableTier = tiers.find(
    tier => quantity >= tier.minQuantity && quantity <= tier.maxQuantity
  );

  if (!applicableTier) {
    return basePrice;
  }

  return basePrice * applicableTier.pricePerUnit;
};

// Enhanced randomization with seeded random for better variety
const getRandomSeed = () => Date.now() + Math.random() * 1000;

export const selectRandomVariants = (
  variants: ProductVariant[],
  count: number,
  dietaryRestriction: 'halal' | 'non-halal',
  seed?: number
): ProductVariant[] => {
  // Filter out variants based on dietary restrictions
  let filteredVariants = [...variants];

  if (dietaryRestriction === 'halal') {
    // Filter out non-halal items (like chicken floss, pork, etc.)
    filteredVariants = filteredVariants.filter(variant => {
      const name = variant.name.toLowerCase();
      return !name.includes('chicken floss') &&
             !name.includes('pork') &&
             !name.includes('bacon') &&
             !name.includes('ham');
    });
  }

  // Use time-based seed for better randomization
  const randomSeed = seed || getRandomSeed();

  // Enhanced shuffle using multiple passes for better randomization
  for (let pass = 0; pass < 3; pass++) {
    for (let i = filteredVariants.length - 1; i > 0; i--) {
      // Use seeded random with additional entropy
      const randomValue = (randomSeed + i + pass) % 1000 / 1000;
      const j = Math.floor((Math.random() + randomValue) / 2 * (i + 1));
      [filteredVariants[i], filteredVariants[j]] = [filteredVariants[j], filteredVariants[i]];
    }
  }

  // Return the first 'count' items
  return filteredVariants.slice(0, Math.min(count, filteredVariants.length));
};

// Get actual product pricing from the product data
const getProductBoxPrice = (product: Product, branch: 'SG' | 'MY' = 'SG'): number => {
  // For gift boxes: RM 60 per box (new pricing)
  if (product.name.toLowerCase().includes('gift box')) {
    return 60.00; // RM 60 per box
  }

  // For other products, use the retail price from the product based on branch
  const priceString = branch === 'SG' ? product.rrp_sgd : product.rrp_myr;

  if (!priceString) {
    // Fallback to the other currency if the preferred one is not available
    const fallbackPrice = branch === 'SG' ? product.rrp_myr : product.rrp_sgd;
    if (fallbackPrice) {
      return parseFloat(fallbackPrice);
    }
    // Default fallback price for non-gift box products
    return 20.00;
  }

  return parseFloat(priceString);
};

export const generateAutomatedGiftBox = (
  config: AutomatedGiftBoxConfig,
  products: Product[],
  productVariants: { [key: number]: ProductVariant[] },
  branch: 'SG' | 'MY' = 'SG'
): AutomatedGiftBox | null => {
  // Detect if this is public access (static data) - Product 78 with flavors already filtered
  const isPublicAccess = products.length === 1 && products[0].id === 78;
  
  // For logged-in users, check if we have any products with variants
  const hasAvailableProducts = products.some(product => 
    productVariants[product.id] && productVariants[product.id].length > 0
  );

  if (!isPublicAccess && !hasAvailableProducts) {
    console.log('No available products with variants found');
    return null;
  }

  // Get brand categories - use static data for public access, real data for logged-in users
  let brandCategories: BrandCategories;
  
  if (isPublicAccess) {
    // Use static data for public access
    brandCategories = categorizeVariantsByBrand();
  } else {
    // For logged-in users, create brand categories from real product data using product IDs
    // Try exact match first, then fallback to partial matching
    let bronysProduct = products.find(p => p.name === "Brony's Brownie Crisps");
    if (!bronysProduct) {
      bronysProduct = products.find(p => p.name.toLowerCase().includes("brony"));
    }

    let kettleProduct = products.find(p => p.name === "The Kettle Gourmet Popcorn - 30g");
    if (!kettleProduct) {
      kettleProduct = products.find(p => {
        const name = p.name.toLowerCase();
        return name.includes("kettle") && name.includes("popcorn");
      });
    }

    let yumiCurlsProduct = products.find(p => p.name === "Yumi Corn Curls");
    if (!yumiCurlsProduct) {
      yumiCurlsProduct = products.find(p => {
        const name = p.name.toLowerCase();
        return name.includes("yumi") && name.includes("curl");
      });
    }

    let yumiSticksProduct = products.find(p => p.name === "Yumi Cornsticks Polybag");
    if (!yumiSticksProduct) {
      yumiSticksProduct = products.find(p => {
        const name = p.name.toLowerCase();
        return name.includes("yumi") && (name.includes("stick") || name.includes("cornstick"));
      });
    }

    console.log('=== PRODUCT MATCHING DEBUG ===');
    console.log('All products:', products.map(p => p.name));
    console.log('Found products:', {
      bronys: bronysProduct?.name || 'NOT FOUND',
      kettle: kettleProduct?.name || 'NOT FOUND',
      yumiCurls: yumiCurlsProduct?.name || 'NOT FOUND',
      yumiSticks: yumiSticksProduct?.name || 'NOT FOUND'
    });

    brandCategories = {
      // Brony's Brownie Crisps (2 needed) - get variants by product ID
      bronys: bronysProduct ? (productVariants[bronysProduct.id] || []) : [],

      // The Kettle Gourmet Popcorn 30g (4 needed) - get variants by product ID
      kettleGourmet: kettleProduct ? (productVariants[kettleProduct.id] || []) : [],

      // Yumi Corn Curls (3 needed) - get variants by product ID
      yumiCurls: yumiCurlsProduct ? (productVariants[yumiCurlsProduct.id] || []) : [],

      // Yumi Cornsticks Polybag (1 needed) - get variants by product ID
      yumiSticks: yumiSticksProduct ? (productVariants[yumiSticksProduct.id] || []) : []
    };

    console.log('Brand categories result:', {
      bronys: brandCategories.bronys.length,
      kettleGourmet: brandCategories.kettleGourmet.length,
      yumiCurls: brandCategories.yumiCurls.length,
      yumiSticks: brandCategories.yumiSticks.length
    });
    console.log('=== END DEBUG ===');
  }
  
  // Randomly select one of the two gift box types
  const selectedGiftBoxType = GIFT_BOX_TYPES[Math.floor(Math.random() * GIFT_BOX_TYPES.length)];
  
  // Check if we have enough variants in each category
  console.log('Brand categories:', {
    bronys: brandCategories.bronys.length,
    kettleGourmet: brandCategories.kettleGourmet.length,
    yumiCurls: brandCategories.yumiCurls.length,
    yumiSticks: brandCategories.yumiSticks.length
  });

  // Select specific quantities from each brand category
  let selectedBronys = selectRandomVariants(brandCategories.bronys, Math.min(2, brandCategories.bronys.length), config.dietaryRestriction);
  let selectedKettleGourmet = selectRandomVariants(brandCategories.kettleGourmet, Math.min(4, brandCategories.kettleGourmet.length), config.dietaryRestriction);
  let selectedYumiCurls = selectRandomVariants(brandCategories.yumiCurls, Math.min(3, brandCategories.yumiCurls.length), config.dietaryRestriction);
  let selectedYumiSticks = selectRandomVariants(brandCategories.yumiSticks, Math.min(1, brandCategories.yumiSticks.length), config.dietaryRestriction);

  // Combine all selected variants
  let allSelectedVariants = [
    ...selectedBronys,
    ...selectedKettleGourmet,
    ...selectedYumiCurls,
    ...selectedYumiSticks
  ];

  // If we don't have enough variants, try to get more from available categories
  if (allSelectedVariants.length < 5) {
    console.log('Not enough variants selected, trying fallback...');

    // Get all available variants as fallback
    const allAvailableVariants: ProductVariant[] = [];
    if (isPublicAccess) {
      allAvailableVariants.push(...STATIC_PRODUCT_VARIANTS[78] || []);
    } else {
      products.forEach(product => {
        const variants = productVariants[product.id] || [];
        allAvailableVariants.push(...variants);
      });
    }

    // If logged-in user has no variants, fallback to static data
    if (allAvailableVariants.length === 0) {
      console.log('⚠️ Logged-in user has no products/variants, using static data fallback');
      allAvailableVariants.push(...STATIC_PRODUCT_VARIANTS[78] || []);
      // Also use static brand categories
      const staticBrandCategories = categorizeVariantsByBrand();
      selectedBronys = selectRandomVariants(staticBrandCategories.bronys, 2, config.dietaryRestriction);
      selectedKettleGourmet = selectRandomVariants(staticBrandCategories.kettleGourmet, 4, config.dietaryRestriction);
      selectedYumiCurls = selectRandomVariants(staticBrandCategories.yumiCurls, 3, config.dietaryRestriction);
      selectedYumiSticks = selectRandomVariants(staticBrandCategories.yumiSticks, 1, config.dietaryRestriction);

      allSelectedVariants = [...selectedBronys, ...selectedKettleGourmet, ...selectedYumiCurls, ...selectedYumiSticks];
      console.log('✅ Using static data: selected', allSelectedVariants.length, 'variants');
    } else if (allSelectedVariants.length === 0 && allAvailableVariants.length > 0) {
      // Use available user variants
      const fallbackVariants = selectRandomVariants(allAvailableVariants, Math.min(10, allAvailableVariants.length), config.dietaryRestriction);
      allSelectedVariants.push(...fallbackVariants);
    }
  }

  // Final check - if we still have no variants, return null
  if (allSelectedVariants.length === 0) {
    console.log('No variants available for gift box generation');
    return null;
  }

  // Build the single product entry for the selected gift box type
  const selectedProducts: { [productId: number]: { name: string; selectedVariants: string[]; price?: number } } = {
    78: {
      name: selectedGiftBoxType.name,
      selectedVariants: allSelectedVariants.map(v => v.name),
      price: 60.00 // RM 60 per box
    }
  };

  // Fixed price: RM 60 per box (new pricing)
  const baseBoxPrice = 60.00;

  // Apply tier discount for volume orders
  const tierMultiplier = DEFAULT_TIER_PRICING.find(
    tier => config.pax >= tier.minQuantity && config.pax <= tier.maxQuantity
  )?.pricePerUnit || 1.0;

  const actualPricePerBox = baseBoxPrice * tierMultiplier;
  const totalPrice = actualPricePerBox * config.pax;

  // Generate tier pricing structure based on actual costs
  const tierPricing = DEFAULT_TIER_PRICING.map(tier => ({
    ...tier,
    pricePerUnit: Number((baseBoxPrice * tier.pricePerUnit).toFixed(2))
  }));

  const giftBoxDescription = `Premium gift box with ${allSelectedVariants.length} assorted flavors from 4 different brands`;

  return {
    name: selectedGiftBoxType.name,
    description: giftBoxDescription,
    giftBoxType: selectedGiftBoxType,
    selectedProducts,
    selectedVariantDetails: allSelectedVariants,
    brandCategories: {
      bronys: selectedBronys,
      kettleGourmet: selectedKettleGourmet,
      yumiCurls: selectedYumiCurls,
      yumiSticks: selectedYumiSticks
    },
    totalPrice,
    pricePerBox: actualPricePerBox,
    actualPricePerBox: actualPricePerBox,
    tierPricing,
    quantity: config.pax,
    priceBreakdown: {
      baseCost: baseBoxPrice,
      markup: 0,
      discount: (1 - tierMultiplier) * 100
    }
  };
};

export const formatGiftBoxForDisplay = (giftBox: AutomatedGiftBox) => {
  const products = Object.values(giftBox.selectedProducts);
  const allVariants = products.flatMap(p => p.selectedVariants);

  return {
    productDescription: giftBox.description,
    pax: giftBox.quantity,
    pricePerBox: giftBox.actualPricePerBox.toFixed(2),
    total: giftBox.totalPrice.toFixed(2),
    selectedProducts: products.map(p => ({ name: p.name, price: p.price })),
    variants: allVariants.map(name => {
      // Find the corresponding variant detail to get the image_url
      const variantDetail = giftBox.selectedVariantDetails.find(v => v.name === name);
      return {
        name,
        image_url: variantDetail?.image_url || null,
        productName: products.find(p => p.selectedVariants.includes(name))?.name || ''
      };
    }),
    // New structure for brand categories
    giftBoxType: giftBox.giftBoxType,
    brandCategories: giftBox.brandCategories,
    tierPricing: giftBox.tierPricing,
    priceBreakdown: giftBox.priceBreakdown
  };
};