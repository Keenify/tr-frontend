import { Product, ProductVariant } from '../../../shared/types/Product';

/**
 * Static/hardcoded product data for public access (incognito mode)
 * This ensures the Gift Suggestion Generator always works even without authentication
 */

export const STATIC_PRODUCTS: Product[] = [
  {
    id: 78, // Using the real product ID from backend
    name: "The Kettle Gourmet Gift Box",
    description: "Premium assorted popcorn gift box with various flavors",
    pack_count_per_box: 6, // 6 boxes per carton as per pricing logic
    recommended_retail_price: "25.00", // 1 carton = RM 25
    company_id: "1",
    created_at: new Date().toISOString()
  }
];

export const STATIC_PRODUCT_VARIANTS: { [key: number]: ProductVariant[] } = {
  // The Kettle Gourmet Gift Box - Product ID 78 (matching backend)
  78: [
    {
      id: 1,
      name: "Minions",
      // REAL URL from Minions Series Product 74
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/74/20250203_063812_Cheese.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: "Christmas Mix & Match Gift Box",
      // WARNING: No real image found for Christmas theme - using null
      image_url: null,
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      name: "CNY Red Dragon",
      // WARNING: No real image found for CNY Red Dragon - using null
      image_url: null,
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      name: "General",
      // REAL URL from Product 78
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/78/20250214_062020_General.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 5,
      name: "Valentine's day",
      // REAL URL - found as Valentines
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/1/20250203_145640_Valentines.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 6,
      name: "SpongeBob",
      // REAL URL from SpongeBob Series Product 73
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/73/20250203_063637_Chocolate.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 7,
      name: "CNY Green Dragon",
      // WARNING: No real image found for CNY Green Dragon - using null
      image_url: null,
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 8,
      name: "Children Day",
      // REAL URL from Product 78
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/78/20250203_145640_Children Day.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    }
  ]
};

/**
 * Get static products for public/incognito access
 */
export const getStaticProducts = (): { products: Product[], productVariants: { [key: number]: ProductVariant[] } } => {
  return {
    products: STATIC_PRODUCTS,
    productVariants: STATIC_PRODUCT_VARIANTS
  };
};