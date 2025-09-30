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
  // The Kettle Gourmet Gift Box - Product ID 78 (ALL 41 flavors for variety)
  78: [
    // Original flavors from screenshot
    {
      id: 1,
      name: "General",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/78/20250214_062020_General.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: "Children Day",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/78/20250203_145640_Children%20Day.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
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
    // SpongeBob Series
    {
      id: 15,
      name: "SpongeBob Chocolate",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/73/20250203_063637_Chocolate.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 16,
      name: "SpongeBob Nasi Lemak",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/73/20250203_063651_Nasi%20Lemak.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 17,
      name: "SpongeBob Pulut Hitam",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/73/20250203_063703_Pulut%20Hitam.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    // Minions Series
    {
      id: 18,
      name: "Minions Cheese",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/74/20250203_063812_Cheese.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 19,
      name: "Minions Chocolate",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/74/20250203_063822_Chocolate.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 20,
      name: "Minions Kaya Toast",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/74/20250203_063836_Kaya%20Butter%20Toast.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    // Pokemon Series
    {
      id: 21,
      name: "Pokemon Chilli Crab",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/76/20250203_145336_Chocolate.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 22,
      name: "Pokemon Chocolate",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/76/20250203_145336_Chocolate.jpg?",
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 23,
      name: "Pokemon Kaya Toast",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/76/20250203_145348_Kaya%20Butter%20Toast.jpg?",
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
    // Seasonal flavors with borrowed working images
    {
      id: 36,
      name: "Lunar New Year Mix",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/1/20250127_115413_Chocolate.jpg?", // Using red-themed chocolate image
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 37,
      name: "Christmas Mix & Match",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/73/20250203_063637_Chocolate.jpg?", // Using festive image
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 38,
      name: "Christmas Assorted",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/74/20250203_063822_Chocolate.jpg?", // Using another festive image
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 39,
      name: "CNY Red Dragon",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/2/20250126_154226_Chocolate.jpg?", // Using red-themed chocolate image
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 40,
      name: "CNY Green Dragon",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/70/20250203_122104_Matcha.jpg?", // Using green-themed image
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 41,
      name: "XMAS Yumi Gift Box",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/67/20250206_192220_Choco.jpg?", // Using festive chocolate
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 42,
      name: "Hari Raya",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/1/20250127_115454_Nasi%20Lemak.jpg?", // Using traditional flavor
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 43,
      name: "Happy Teacher Day",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/78/20250203_145640_Children%20Day.jpg?", // Using special day image
      product_id: 78,
      created_at: new Date().toISOString()
    },
    // Truncated name variants for backend lookup (these match the truncated names from PDF generation)
    {
      id: 47,
      name: "Lunar New Year Mi...",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/1/20250127_115413_Chocolate.jpg?", // Same as Lunar New Year Mix
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 48,
      name: "Christmas Mix & M...",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/73/20250203_063637_Chocolate.jpg?", // Same as Christmas Mix & Match
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 49,
      name: "The Kettle Gourme...",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/78/20250214_062020_General.jpg?", // Same as The Kettle Gourmet Gift Box
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 50,
      name: "SpongeBob Pulut H...",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/73/20250203_063703_Pulut%20Hitam.jpg?", // Same as SpongeBob Pulut Hitam
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 51,
      name: "Premium Chicken F...",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/2/20250126_154201_Chicken%20Floss.jpg?", // Same as Premium Chicken Floss
      product_id: 78,
      created_at: new Date().toISOString()
    },
    {
      id: 52,
      name: "Premium Salted Ca...",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/2/20250126_154334_Salted%20Caramel.jpg?", // Same as Premium Salted Caramel
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