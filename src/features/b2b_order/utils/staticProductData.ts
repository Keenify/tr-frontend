import { Product, ProductVariant } from '../../../shared/types/Product';

/**
 * Static/hardcoded product data for public access (incognito mode)
 * This ensures the Gift Suggestion Generator always works even without authentication
 */

export const STATIC_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "The Kettle Gourmet Gift Box",
    description: "Premium assorted popcorn gift box with various flavors",
    pack_count_per_box: 6,
    recommended_retail_price: "25.00",
    company_id: "1",
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    name: "Premium Mix Gift Box",
    description: "Deluxe selection of gourmet popcorn varieties",
    pack_count_per_box: 6,
    recommended_retail_price: "30.00",
    company_id: "1",
    created_at: new Date().toISOString()
  }
];

export const STATIC_PRODUCT_VARIANTS: { [key: number]: ProductVariant[] } = {
  1: [
    {
      id: 1,
      name: "Christmas Mix & Match",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/1/20250127_115413_Christmas.jpg?",
      product_id: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: "CNY Red Dragon",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/1/20250214_062020_CNY_Red.jpg?",
      product_id: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      name: "General",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/78/20250214_062020_General.jpg?",
      product_id: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      name: "Valentine's Day",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/1/20250203_145640_Valentines.jpg?",
      product_id: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 5,
      name: "SpongeBob",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/1/20250127_115413_SpongeBob.jpg?",
      product_id: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 6,
      name: "CNY Green Dragon",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/1/20250214_062441_CNY_Green.jpg?",
      product_id: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 7,
      name: "Caramel Popcorn",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/1/20250127_115413_Caramel.jpg?",
      product_id: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 8,
      name: "Cheese Popcorn",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/1/20250214_062441_Cheese.jpg?",
      product_id: 1,
      created_at: new Date().toISOString()
    }
  ],
  2: [
    {
      id: 9,
      name: "Premium Caramel",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/2/20250127_115413_Premium_Caramel.jpg?",
      product_id: 2,
      created_at: new Date().toISOString()
    },
    {
      id: 10,
      name: "Premium Cheese",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/2/20250214_062441_Premium_Cheese.jpg?",
      product_id: 2,
      created_at: new Date().toISOString()
    },
    {
      id: 11,
      name: "Chocolate Drizzle",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/1/20250127_115413_Chocolate.jpg?",
      product_id: 2,
      created_at: new Date().toISOString()
    },
    {
      id: 12,
      name: "Mixed Berry",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/2/20250203_145640_Mixed_Berry.jpg?",
      product_id: 2,
      created_at: new Date().toISOString()
    },
    {
      id: 13,
      name: "Truffle Salt",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/2/20250214_062020_Truffle_Salt.jpg?",
      product_id: 2,
      created_at: new Date().toISOString()
    },
    {
      id: 14,
      name: "Spicy Jalapeño",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/2/20250127_115413_Spicy_Jalapeno.jpg?",
      product_id: 2,
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