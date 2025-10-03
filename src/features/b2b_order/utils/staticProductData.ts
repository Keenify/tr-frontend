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
    pack_count_per_box: 6, // 6 boxes per carton
    rrp_sgd: null,
    rrp_myr: "60.00", // 1 carton = RM 60 (RM 10 per box)
    company_id: "1",
    created_at: new Date().toISOString()
  }
];

export const STATIC_PRODUCT_VARIANTS: { [key: number]: ProductVariant[] } = {
  // The Kettle Gourmet Gift Box - Product ID 78 (Only actual flavors, gift box variants removed)
  78: [
    // Classic Popcorn Flavors
    {
      id: 4,
      name: "Chocolate",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/1/20250127_115413_Chocolate.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 6,
      name: "Salted Caramel",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/1/20250127_115546_Salted%20Caramel.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    // Local Singapore Flavors
    {
      id: 7,
      name: "Chilli Crab",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/1/20250127_115413_Chocolate.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 8,
      name: "Kaya Butter Toast",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/1/20250127_115437_Kaya%20Butter%20Toast.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 9,
      name: "Nasi Lemak",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/1/20250127_115454_Nasi%20Lemak.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 10,
      name: "Fish Head Curry",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/1/20250127_115424_Fish%20Head.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 11,
      name: "Pulut Hitam",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/1/20250127_115530_Pulut%20Hitam.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 12,
      name: "Tom Yum",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/1/20250206_192235_Tom%20Yum.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 13,
      name: "Chicken Floss",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/1/20250203_064312_Chicken%20Floss.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 14,
      name: "Mala",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/1/20250206_192113_Mala.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    // Premium 65g Variants
    {
      id: 24,
      name: "Premium Chicken Floss",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/2/20250126_154201_Chicken%20Floss.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 25,
      name: "Premium Chilli Crab",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/2/20250126_154226_Chocolate.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 26,
      name: "Premium Chocolate",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/2/20250126_154226_Chocolate.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 27,
      name: "Premium Fish Head",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/2/20250126_154240_Fish%20Head%20Curry.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 28,
      name: "Premium Kaya Toast",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/2/20250126_154253_Kaya%20Butter%20Toast.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 29,
      name: "Premium Nasi Lemak",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/2/20250126_154310_Nasi%20Lemak.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 30,
      name: "Premium Pulut Hitam",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/2/20250126_154321_Pulut%20Hitam.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 31,
      name: "Premium Salted Caramel",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/2/20250126_154334_Salted%20Caramel.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    // Other Brand Flavors
    {
      id: 32,
      name: "Fruity Popcorn",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/67/20250206_192208_Fruits.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 33,
      name: "Classic Caramel",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/67/20250206_192140_Caramel.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 34,
      name: "Original Butter",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/67/20250206_192151_Original.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 35,
      name: "Double Chocolate",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/67/20250206_192220_Choco.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    // Additional unique flavors
    {
      id: 44,
      name: "BBQ Chicken",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/68/20250203_121735_Yumi BBQ%20Chicken.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 45,
      name: "Matcha Green Tea",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/70/20250203_122104_Matcha.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 46,
      name: "Earl Grey Tea",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/71/20250203_122210_Earl%20Grey%20Jelly%20Drink.jpg?",
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