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
      name: "General",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/78/20250214_062020_General.jpg?",
      product_id: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: "Children Day",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/78/20250203_145640_Children Day.jpg?",
      product_id: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      name: "Chocolate",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/1/20250127_115413_Chocolate.jpg?",
      product_id: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      name: "Cheese",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/1/20250214_062441_Cheese.jpg?",
      product_id: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 5,
      name: "Caramel",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/1/20250127_115413_Caramel.jpg?",
      product_id: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 6,
      name: "Mixed Berry",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/2/20250203_145640_Mixed_Berry.jpg?",
      product_id: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 7,
      name: "Valentine Special",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/1/20250203_145640_Valentines.jpg?",
      product_id: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 8,
      name: "Premium Mix",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/2/20250127_115413_Premium_Caramel.jpg?",
      product_id: 1,
      created_at: new Date().toISOString()
    }
  ],
  2: [
    {
      id: 9,
      name: "General Deluxe",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/78/20250214_062020_General.jpg?",
      product_id: 2,
      created_at: new Date().toISOString()
    },
    {
      id: 10,
      name: "Chocolate Premium",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/1/20250127_115413_Chocolate.jpg?",
      product_id: 2,
      created_at: new Date().toISOString()
    },
    {
      id: 11,
      name: "Cheese Deluxe",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/1/20250214_062441_Cheese.jpg?",
      product_id: 2,
      created_at: new Date().toISOString()
    },
    {
      id: 12,
      name: "Special Edition",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/78/20250203_145640_Children Day.jpg?",
      product_id: 2,
      created_at: new Date().toISOString()
    },
    {
      id: 13,
      name: "Berry Mix",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/2/20250203_145640_Mixed_Berry.jpg?",
      product_id: 2,
      created_at: new Date().toISOString()
    },
    {
      id: 14,
      name: "Valentine Premium",
      image_url: "https://ajnldibtdiyclquurxio.supabase.co/storage/v1/object/public/content-image/products/1/20250203_145640_Valentines.jpg?",
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