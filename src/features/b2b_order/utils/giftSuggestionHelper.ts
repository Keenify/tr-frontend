import { Product, ProductVariant } from '../../../shared/types/Product';

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
  // Use the retail price from the product based on branch
  const priceString = branch === 'SG' ? product.rrp_sgd : product.rrp_myr;

  if (!priceString) {
    // Fallback to the other currency if the preferred one is not available
    const fallbackPrice = branch === 'SG' ? product.rrp_myr : product.rrp_sgd;
    if (fallbackPrice) {
      return parseFloat(fallbackPrice);
    }
    // Default fallback price if no pricing is available
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
  // Filter products that have variants
  const availableProducts = products.filter(
    product => productVariants[product.id]?.length > 0
  );

  if (availableProducts.length === 0) {
    return null;
  }

  // Determine number of products to include based on budget with some randomization
  let baseProductCount = 3; // Default
  if (config.budgetPerPerson < 20) {
    baseProductCount = 2;
  } else if (config.budgetPerPerson >= 50) {
    baseProductCount = 4;
  }

  // Add some randomization to product count (±1 product for variety)
  const randomVariation = Math.random() > 0.5 ? 1 : 0;
  const maxPossible = Math.min(availableProducts.length, baseProductCount + 1);
  const minPossible = Math.max(2, baseProductCount - 1);
  const productsToInclude = Math.min(maxPossible, Math.max(minPossible, baseProductCount + (Math.random() > 0.7 ? randomVariation : 0)));

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

  const selectedProductsList = shuffledProducts.slice(0, Math.min(productsToInclude, availableProducts.length));

  // Build selected products object with random variants and calculate actual costs
  const selectedProducts: { [productId: number]: { name: string; selectedVariants: string[]; price?: number } } = {};
  const allSelectedVariants: string[] = [];
  const allSelectedVariantDetails: ProductVariant[] = [];
  let totalBaseCost = 0;

  let averageBoxPrice = 0;
  let totalProducts = 0;

  selectedProductsList.forEach(product => {
    const variants = productVariants[product.id] || [];
    const productBoxPrice = getProductBoxPrice(product, branch);

    // For gift box products, select 1 variant
    // For other products, select 1-4 variants with better randomization
    const isGiftBox = product.name.toLowerCase().includes('gift box');
    let variantCount;
    if (isGiftBox) {
      variantCount = 1;
    } else {
      // More variety in variant selection: 1-4 variants
      const maxVariants = Math.min(4, variants.length);
      const minVariants = 1;
      variantCount = minVariants + Math.floor(Math.random() * (maxVariants - minVariants + 1));
    }

    const variantSeed = getRandomSeed() + product.id; // Unique seed per product
    const randomVariants = selectRandomVariants(variants, variantCount, config.dietaryRestriction, variantSeed);

    if (randomVariants.length > 0) {
      selectedProducts[product.id] = {
        name: product.name,
        selectedVariants: randomVariants.map(v => v.name),
        price: productBoxPrice
      };
      allSelectedVariants.push(...randomVariants.map(v => v.name));
      allSelectedVariantDetails.push(...randomVariants);
      averageBoxPrice += productBoxPrice;
      totalProducts++;
    }
  });

  // Calculate actual box price as average of selected products
  const baseBoxPrice = totalProducts > 0 ? averageBoxPrice / totalProducts : 20.00;

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

  // Create gift box name based on selected flavors
  const flavorSample = allSelectedVariants.slice(0, 2).join(' & ');
  const giftBoxName = flavorSample || 'Custom Gift Box';

  return {
    name: giftBoxName,
    description: `${selectedProductsList.length}-Product Gift Box with ${allSelectedVariants.length} Flavors`,
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