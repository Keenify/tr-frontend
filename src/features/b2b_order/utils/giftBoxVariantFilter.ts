import { ProductVariant } from '../../../shared/types/Product';

/**
 * List of variant names that represent pre-configured gift boxes
 * rather than individual product flavors.
 * These should be filtered out from the flavor varieties display.
 */
export const GIFT_BOX_VARIANT_NAMES = new Set([
  'Children Day',
  'General',
  'Hari Raya',
  'Christmas Mix & Match Gift Box',
  'Christmas Mix & Match',
  'Happy Teacher Day',
  'National Day',
  'Christmas Assorted',
  'Crispy Cones',
  'Minions',
  "Valentine's day",
  'Spongebob',
  'SpongeBob',
  'CNY White Dragon',
  'CNY Green Dragon',
  'CNY Red Dragon',
  'Yumi Gift Box',
  'XMAS Yumi Gift Box',
  'XMAS Yumi GIft Box',
  "Lunar New Year Mini 'Huat' Box Info",
  'Lunar New Year Mix',
  // Non-food items
  'Post card size - 10.16 x 15.24cm',
  'Thank you Card',
  // Truncated variants
  'Lunar New Year Mi...',
  'Christmas Mix & M...',
  'The Kettle Gourme...',
  'SpongeBob Pulut H...',
  'Premium Chicken F...',
  'Premium Salted Ca...',
]);

/**
 * Check if a variant name represents a gift box configuration
 * rather than a product flavor.
 */
export const isGiftBoxVariant = (variantName: string): boolean => {
  return GIFT_BOX_VARIANT_NAMES.has(variantName);
};

/**
 * Filter out gift box variants from a list of variants,
 * returning only actual product flavors.
 */
export const filterFlavorVariants = (variants: ProductVariant[]): ProductVariant[] => {
  return variants.filter(variant => !isGiftBoxVariant(variant.name));
};
