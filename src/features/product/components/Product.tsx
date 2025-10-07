import React from 'react';
import { Session } from '@supabase/supabase-js';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { ClipLoader } from 'react-spinners';
import { Product as ProductType, ProductVariant, CreateProductRequest, UpdateProductRequest } from '../../../shared/types/Product';
import { createProduct, getProductsByCompany, updateProduct, deleteProduct } from '../../../services/useProducts';
import { getProductVariants, createProductVariant } from '../../../services/useProductVariants';
import CreateProductModal from './CreateProductModal';
import EditProductModal from './EditProductModal';
import DeleteProductModal from './DeleteProductModal';
import CreateVariantModal from './CreateVariantModal';
import VariantGrid from './VariantGrid';
import EditProductExportModal from './EditProductExportModal';
import ProductSlide from './ProductSlide';
import toast from 'react-hot-toast';
import { cacheAllProducts } from '../../b2b_order/utils/productCache';

interface ProductProps {
  session: Session;
}

const Product: React.FC<ProductProps> = ({ session }) => {
  const { companyInfo, error, isLoading } = useUserAndCompanyData(session.user.id);
  const [products, setProducts] = React.useState<ProductType[]>([]);
  const [productVariants, setProductVariants] = React.useState<{ [key: number]: ProductVariant[] }>({});
  const [loadingProducts, setLoadingProducts] = React.useState<boolean>(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<ProductType | null>(null);
  const [deletingProduct, setDeletingProduct] = React.useState<ProductType | null>(null);
  const [creatingVariantForProduct, setCreatingVariantForProduct] = React.useState<ProductType | null>(null);
  const [activeTab, setActiveTab] = React.useState('products');
  const [editMenuOpen, setEditMenuOpen] = React.useState<number | null>(null);
  const [editingProductExport, setEditingProductExport] = React.useState<ProductType | null>(null);

  const fetchProducts = React.useCallback(async () => {
    if (!companyInfo?.id) return;
    
    setLoadingProducts(true);
    try {
      const products = await getProductsByCompany(companyInfo.id);
      setProducts(products);
      
      // Fetch variants for each product with error handling
      const variantsPromises = products.map(product => 
        getProductVariants(product.id.toString())
          .then(variants => ({ productId: product.id, variants }))
          .catch(error => {
            console.error(`Failed to fetch variants for product ${product.id}:`, error);
            return { productId: product.id, variants: [] };
          })
      );

      const variantsResults = await Promise.all(variantsPromises);
      const variantsMap: { [key: number]: ProductVariant[] } = {};
      variantsResults.forEach(({ productId, variants }) => {
        variantsMap[productId] = variants;
      });
      
      setProductVariants(variantsMap);
    } catch (error) {
      setFetchError('Failed to load products or variants');
      console.error(error);
    } finally {
      setLoadingProducts(false);
    }
  }, [companyInfo?.id]);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Helper function to refresh the gift generator cache
  const refreshProductCache = React.useCallback(async () => {
    if (companyInfo?.id) {
      try {
        console.log('🔄 Auto-refreshing product cache after CRUD operation...');
        await cacheAllProducts(companyInfo.id);
        console.log('✅ Product cache refreshed successfully');
      } catch (error) {
        console.warn('⚠️ Failed to refresh product cache:', error);
        // Don't throw error - cache refresh is not critical for Product feature functionality
      }
    }
  }, [companyInfo?.id]);

  const handleCreateProduct = async (productData: CreateProductRequest) => {
    try {
      await createProduct(productData);
      await fetchProducts();
      await refreshProductCache(); // Auto-refresh cache for Gift Generator
      toast.success('Product created successfully');
    } catch (error) {
      console.error('Failed to create product:', error);
      toast.error('Failed to create product');
    }
  };

  const handleUpdateProduct = async (productId: number, productData: UpdateProductRequest) => {
    try {
      await updateProduct(productId, productData);
      await fetchProducts();
      await refreshProductCache(); // Auto-refresh cache for Gift Generator
      toast.success('Product updated successfully');
    } catch (error) {
      console.error('Failed to update product:', error);
      toast.error('Failed to update product');
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
      await deleteProduct(productId);
      await fetchProducts();
      await refreshProductCache(); // Auto-refresh cache for Gift Generator
      toast.success('Product deleted successfully');
      setDeletingProduct(null);
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleCreateVariant = async (productId: number, data: { name: string; image?: File }) => {
    try {
      await createProductVariant({
        name: data.name,
        image: data.image,
        product_id: productId,
        cost_of_goods_sold: '0.00'
      });
      await fetchProducts();
      await refreshProductCache(); // Auto-refresh cache for Gift Generator
      toast.success('Variant created successfully');
      setCreatingVariantForProduct(null);
    } catch (error) {
      console.error('Failed to create variant:', error);
      toast.error('Failed to create variant');
    }
  };

  const refreshVariants = React.useCallback(async (productId: number) => {
    try {
      const variants = await getProductVariants(productId.toString());
      setProductVariants(prev => ({
        ...prev,
        [productId]: variants
      }));
      await refreshProductCache(); // Auto-refresh cache for Gift Generator
    } catch (error) {
      console.error('Failed to refresh variants:', error);
      setFetchError('Failed to refresh variants');
    }
  }, [refreshProductCache]);

  const filteredProducts = React.useMemo(() => {
    return products; // Return all products without filtering
  }, [products]);

  if (isLoading || loadingProducts) {
    return (
      <div className="flex justify-center items-center h-full">
        <ClipLoader color="#36d7b7" />
      </div>
    );
  }

  if (error || fetchError) {
    return (
      <div className="text-red-500">
        Error loading data: {error?.message || fetchError}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Product Page</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          New Product
        </button>
      </div>
      
      <div className="mb-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('products')}
              className={`mr-8 py-2 px-1 ${
                activeTab === 'products'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab('slides')}
              className={`py-2 px-1 ${
                activeTab === 'slides'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Product Slides
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'products' ? (
        <>
          <CreateProductModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleCreateProduct}
            companyId={companyInfo?.id || ''}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
                  <div className="flex gap-2">
                    <div className="relative">
                      <button
                        title="Edit options"
                        onClick={() => setEditMenuOpen(editMenuOpen === product.id ? null : product.id)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-12 12a2 2 0 01-2.828 0 2 2 0 010-2.828l12-12z" />
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-12 12a2 2 0 01-2.828 0 2 2 0 010-2.828l12-12z" />
                        </svg>
                      </button>
                      {editMenuOpen === product.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setEditingProduct(product);
                                setEditMenuOpen(null);
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Edit Product Details
                            </button>
                            <button
                              onClick={() => {
                                setEditingProductExport(product);
                                setEditMenuOpen(null);
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Edit Product Export Details
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      title="Delete product"
                      onClick={() => setDeletingProduct(product)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-gray-600">Pack Count: {product.pack_count_per_box}</p>
                <div className="text-gray-600">
                  {product.rrp_sgd && <p>Retail Price: SGD ${product.rrp_sgd}</p>}
                  {product.rrp_myr && <p>Retail Price: MYR ${product.rrp_myr}</p>}
                </div>
                
                <div className="mt-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Variants:</h3>
                    <button
                      onClick={() => setCreatingVariantForProduct(product)}
                      className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    >
                      New Variant
                    </button>
                  </div>
                  {productVariants[product.id]?.length > 0 ? (
                    <VariantGrid 
                      variants={productVariants[product.id]} 
                      onVariantUpdate={() => refreshVariants(product.id)}
                    />
                  ) : (
                    <p className="text-gray-500 mt-1">No variants available</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {editingProduct && (
            <EditProductModal
              isOpen={!!editingProduct}
              onClose={() => setEditingProduct(null)}
              onSubmit={(data) => handleUpdateProduct(editingProduct.id, data)}
              product={editingProduct}
            />
          )}

          {deletingProduct && (
            <DeleteProductModal
              isOpen={!!deletingProduct}
              onClose={() => setDeletingProduct(null)}
              onConfirm={() => handleDeleteProduct(deletingProduct.id)}
              productName={deletingProduct.name}
            />
          )}

          {creatingVariantForProduct && (
            <CreateVariantModal
              isOpen={!!creatingVariantForProduct}
              onClose={() => setCreatingVariantForProduct(null)}
              onSubmit={(data) => handleCreateVariant(creatingVariantForProduct.id, data)}
            />
          )}

          {editingProductExport && (
            <EditProductExportModal
              isOpen={!!editingProductExport}
              onClose={() => setEditingProductExport(null)}
              product={editingProductExport}
            />
          )}
        </>
      ) : (
        <ProductSlide session={session} />
      )}
    </div>
  );
};

export default Product;
