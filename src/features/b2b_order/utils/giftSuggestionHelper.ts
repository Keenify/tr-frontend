import { Product, ProductVariant } from '../../../shared/types/Product';
import { filterFlavorVariants } from './giftBoxVariantFilter';

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
  selectedProducts: {
    [productId: number]: {
      name: string;
      selectedVariants: string[];
      price?: number;
    };
  };
  selectedVariantDetails: ProductVariant[];
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
  // For gift boxes: 1 carton = 6 boxes = RM 60, so 1 box = RM 10
  if (product.name.toLowerCase().includes('gift box')) {
    return 60.00 / 6; // RM 10 per box
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

  let availableProducts: Product[];

  if (isPublicAccess) {
    // PUBLIC ACCESS: Use the gift box product (it already has clean flavor variants in static data)
    availableProducts = products.filter(product => productVariants[product.id]?.length > 0);
  } else {
    // LOGGED-IN USER: Filter for actual popcorn/snack products (NOT gift box product)
    availableProducts = products.filter(product => {
      const hasVariants = productVariants[product.id]?.length > 0;
      const isNotGiftBoxProduct = !product.name.toLowerCase().includes('gift box');
      return hasVariants && isNotGiftBoxProduct;
    });
  }

  if (availableProducts.length === 0) {
    return null;
  }

  // Select 2-3 products to get a nice variety of ~8 flavors total
  // (2-4 flavors per product × 2-3 products = 4-12 flavors, average ~8)
  const productsToInclude = Math.min(availableProducts.length, 2 + Math.floor(Math.random() * 2)); // 2 or 3 products

  // Enhanced product randomization with time-based seed
  const productSeed = getRandomSeed();
  const shuffledProducts = [...availableProducts];

  // Multiple shuffle passes for better randomization
  for (let pass = 0; pass < 3; pass++) {
    for (let i = shuffledProducts.length - 1; i > 0; i--) {
      const randomValue = (productSeed + i + pass * 100) % 1000 / 1000;
      const j = Math.floor((Math.random() + randomValue) / 2 * (i + 1));
      [shuffledProducts[i], shuffledProducts[j]] = [shuffledProducts[j], shuffledProducts[i]];
    }
  }

  // Select 8 flavors mixed from multiple products for variety
  const targetFlavorCount = 8;
  const selectedFlavors: ProductVariant[] = [];
  const usedFlavorNames = new Set<string>(); // Track to avoid duplicates

  // Shuffle products for random selection order
  const shuffledAvailableProducts = [...shuffledProducts.slice(0, availableProducts.length)];

  // Determine how many flavors to take from each product to reach 8 total
  const flavorsPerProduct = Math.ceil(targetFlavorCount / Math.min(shuffledAvailableProducts.length, 3));

  // Collect flavors from multiple products
  for (const product of shuffledAvailableProducts) {
    if (selectedFlavors.length >= targetFlavorCount) break;

    const allVariants = productVariants[product.id] || [];
    // Filter out gift box variants, keeping only actual flavors
    const flavors = filterFlavorVariants(allVariants);

    // Filter out already used flavors to avoid duplicates
    const uniqueFlavors = flavors.filter(f => !usedFlavorNames.has(f.name));

    if (uniqueFlavors.length > 0) {
      // Take 2-3 flavors from this product
      const variantSeed = getRandomSeed() + product.id;
      const flavorsToTake = Math.min(
        flavorsPerProduct,
        uniqueFlavors.length,
        targetFlavorCount - selectedFlavors.length
      );

      const productFlavors = selectRandomVariants(
        uniqueFlavors,
        flavorsToTake,
        config.dietaryRestriction,
        variantSeed
      );

      // Add to selected flavors and mark as used
      productFlavors.forEach(flavor => {
        selectedFlavors.push(flavor);
        usedFlavorNames.add(flavor.name);
      });
    }
  }

  // Build the single product entry for "The Kettle Gourmet Gift Box"
  const selectedProducts: { [productId: number]: { name: string; selectedVariants: string[]; price?: number } } = {
    78: {
      name: 'The Kettle Gourmet Gift Box',
      selectedVariants: selectedFlavors.map(v => v.name),
      price: 60.00 / 6 // RM 10 per box
    }
  };

  const allSelectedVariants = selectedFlavors.map(v => v.name);
  const allSelectedVariantDetails = selectedFlavors;

  // Fixed price: RM 10 per box (60 RM per carton / 6 boxes)
  const baseBoxPrice = 10.00;

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

  // Use "The Kettle Gourmet Gift Box" as the product name for branding
  const giftBoxName = 'The Kettle Gourmet Gift Box';
  const giftBoxDescription = `Premium gift box with ${allSelectedVariants.length} assorted flavors`;

  return {
    name: giftBoxName,
    description: giftBoxDescription,
    selectedProducts,
    selectedVariantDetails: allSelectedVariantDetails,
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
    tierPricing: giftBox.tierPricing,
    priceBreakdown: giftBox.priceBreakdown
  };
};