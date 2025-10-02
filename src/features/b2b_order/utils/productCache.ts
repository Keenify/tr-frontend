import { Product, ProductVariant } from '../../../shared/types/Product';
import { getProductsByCompany } from '../../../services/useProducts';
import { getProductVariants } from '../../../services/useProductVariants';
import { filterFlavorVariants } from './giftBoxVariantFilter';

interface CachedProduct extends Product {
  variants: ProductVariant[];
  cached_at: string;
}

interface ProductCache {
  products: CachedProduct[];
  last_updated: string;
  company_id: string;
  cache_version?: number; // Version to track filter updates
}

// Increment this version number when filter logic changes
const CACHE_VERSION = 2;

const CACHE_KEY = 'gift_generator_product_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Fetch all products and their variants from the Product feature and cache them
 */
export const cacheAllProducts = async (companyId: string): Promise<CachedProduct[]> => {
  try {
    console.log('🔄 Fetching and caching all products from Product feature...');

    // Fetch all products for the company
    const products = await getProductsByCompany(companyId);
    console.log(`📦 Found ${products.length} products in Product feature`);

    // Fetch variants for each product
    const cachedProducts: CachedProduct[] = [];

    for (const product of products) {
      try {
        console.log(`🌈 Fetching variants for "${product.name}" (ID: ${product.id})`);
        const variants = await getProductVariants(product.id.toString());
        console.log(`   ✅ Found ${variants.length} variants (before filtering)`);

        // Filter out gift box variants, keeping only actual flavors
        const flavorVariants = filterFlavorVariants(variants);
        console.log(`   🎯 Filtered to ${flavorVariants.length} flavor variants (removed ${variants.length - flavorVariants.length} gift box variants)`);

        cachedProducts.push({
          ...product,
          variants: flavorVariants,
          cached_at: new Date().toISOString()
        });
      } catch (error) {
        console.warn(`⚠️ Failed to fetch variants for product ${product.id}:`, error);
        // Include product even without variants
        cachedProducts.push({
          ...product,
          variants: [],
          cached_at: new Date().toISOString()
        });
      }
    }

    // Create cache object
    const cache: ProductCache = {
      products: cachedProducts,
      last_updated: new Date().toISOString(),
      company_id: companyId,
      cache_version: CACHE_VERSION
    };

    // Store in localStorage
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    console.log(`✅ Cached ${cachedProducts.length} products with variants to localStorage`);

    // Log summary of cached products
    console.log('📋 Cached Products Summary:');
    cachedProducts.forEach(product => {
      console.log(`   • ${product.name}: ${product.variants.length} variants`);
    });

    return cachedProducts;
  } catch (error) {
    console.error('❌ Failed to cache products:', error);
    return [];
  }
};

/**
 * Get cached products, or fetch and cache if not available/expired
 */
export const getCachedProducts = async (companyId?: string): Promise<{
  products: Product[];
  productVariants: { [key: number]: ProductVariant[] };
}> => {
  try {
    // Try to get from cache first
    const cachedData = localStorage.getItem(CACHE_KEY);

    if (cachedData) {
      const cache: ProductCache = JSON.parse(cachedData);
      const cacheAge = Date.now() - new Date(cache.last_updated).getTime();

      // Check if cache version matches (invalidate old cache when filter logic changes)
      const isCacheVersionValid = cache.cache_version === CACHE_VERSION;

      if (!isCacheVersionValid) {
        console.log('⚠️ Cache version mismatch - clearing old cache with outdated filters');
        localStorage.removeItem(CACHE_KEY);
      }

      // For public access (no companyId), never expire the cache
      // For company-specific access, check expiration and company match
      if (isCacheVersionValid && ((!companyId) || (cacheAge < CACHE_DURATION && cache.company_id === companyId))) {
        console.log('📋 Using cached products from localStorage');

        // Convert to the format expected by the gift generator
        const products = cache.products.map(({ variants, cached_at, ...product }) => product);
        const productVariants: { [key: number]: ProductVariant[] } = {};

        cache.products.forEach(product => {
          productVariants[product.id] = product.variants;
        });

        console.log(`✅ Loaded ${products.length} cached products with variants`);
        return { products, productVariants };
      } else {
        console.log('⏰ Cache expired or company mismatch, will refresh');
      }
    }

    // If no cache or expired, and we have a company ID, fetch fresh data
    if (companyId) {
      console.log('🔄 No valid cache, fetching fresh products...');
      const cachedProducts = await cacheAllProducts(companyId);

      // Convert to expected format
      const products = cachedProducts.map(({ variants, cached_at, ...product }) => product);
      const productVariants: { [key: number]: ProductVariant[] } = {};

      cachedProducts.forEach(product => {
        productVariants[product.id] = product.variants;
      });

      return { products, productVariants };
    }

    // Fallback: return cached data even if expired (for public access)
    if (cachedData) {
      console.log('🔄 Using expired cache for public access');
      const cache: ProductCache = JSON.parse(cachedData);

      const products = cache.products.map(({ variants, cached_at, ...product }) => product);
      const productVariants: { [key: number]: ProductVariant[] } = {};

      cache.products.forEach(product => {
        productVariants[product.id] = product.variants;
      });

      return { products, productVariants };
    }

    console.log('❌ No cached products available');
    return { products: [], productVariants: {} };

  } catch (error) {
    console.error('❌ Error getting cached products:', error);
    return { products: [], productVariants: {} };
  }
};

/**
 * Clear the product cache
 */
export const clearProductCache = (): void => {
  localStorage.removeItem(CACHE_KEY);
  console.log('🗑️ Product cache cleared');
};

/**
 * Get cache info for debugging
 */
export const getCacheInfo = (): { hasCache: boolean; lastUpdated?: string; productCount?: number; companyId?: string } => {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      const cache: ProductCache = JSON.parse(cachedData);
      return {
        hasCache: true,
        lastUpdated: cache.last_updated,
        productCount: cache.products.length,
        companyId: cache.company_id
      };
    }
    return { hasCache: false };
  } catch {
    return { hasCache: false };
  }
};

/**
 * Initialize cache for public access if not already present
 * This ensures products are always available even for anonymous users
 */
export const initializePublicCache = async (): Promise<void> => {
  try {
    const cacheInfo = getCacheInfo();

    // If cache already exists, don't override it
    if (cacheInfo.hasCache) {
      console.log('✅ Product cache already initialized');
      return;
    }

    console.log('🚀 Initializing product cache for public access...');

    // Use a default company ID to populate cache
    // You can change this to your preferred default company
    const DEFAULT_COMPANY_ID = '1';

    await cacheAllProducts(DEFAULT_COMPANY_ID);
    console.log('✅ Product cache initialized for public access');

  } catch (error) {
    console.warn('⚠️ Failed to initialize public cache:', error);
  }
};