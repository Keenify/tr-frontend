// One-time script to populate product cache for public access
// Run this in browser console on a page with company login

async function populateProductCache() {
  console.log('🚀 Starting cache population...');

  // Import the cache function
  const { cacheAllProducts } = await import('./productCache.ts');

  // Use a default company ID (or current logged in company)
  const companyId = '1'; // Adjust this to your default company ID

  try {
    const cachedProducts = await cacheAllProducts(companyId);
    console.log(`✅ Successfully cached ${cachedProducts.length} products for public access`);
    console.log('🎉 Cache is now available for public users (including incognito mode)');
    return cachedProducts;
  } catch (error) {
    console.error('❌ Failed to populate cache:', error);
  }
}

// Run the function
populateProductCache();