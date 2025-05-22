"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  description: string;
  detailedDescription: string;
  imageUrl: string;
  price: number;
  stockQuantity: number;
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedProductsResponse {
  data: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const PRODUCT_SERVICE_API_URL = "http://127.0.0.1:58951/products";

  useEffect(() => {
    async function fetchProducts() {
      if (!PRODUCT_SERVICE_API_URL.includes(":")) {
        setError("Product service API URL is not valid. Please check the URL.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await fetch(PRODUCT_SERVICE_API_URL);
        if (!response.ok) {
          throw new Error(`API request is fail: ${response.status}`);
        }
        const data: PaginatedProductsResponse = await response.json();
        setProducts(data.data || []);
        setError(null);
      } catch (err: unknown) {
        console.error("When getting products error occured:", err);
        setError(
          err instanceof Error ? err.message : "Products not loading..."
        );
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [PRODUCT_SERVICE_API_URL]);
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-600">
        Products
      </h1>

      {loading && (
        <p className="text-center text-gray-500">Products loading..</p>
      )}
      {error && <p className="text-center text-red-500">Hata: {error}</p>}

      {!loading && !error && products.length === 0 && (
        <p className="text-center text-gray-700">
          No products found. Please check the API URL or try again later.
        </p>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="border border-gray-200 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={300}
                height={200}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://via.placeholder.com/300x200.png?text=Resim+Yok";
                }}
              />
              <div className="p-4">
                <h2
                  className="text-xl font-semibold mb-2 truncate"
                  title={product.name}
                >
                  {product.name}
                </h2>
                <p
                  className="text-gray-600 text-sm mb-1 truncate"
                  title={product.description}
                >
                  {product.description}
                </p>
                {product.detailedDescription && (
                  <p
                    className="text-gray-500 text-xs mb-3 truncate"
                    title={product.detailedDescription}
                  >
                    {product.detailedDescription}
                  </p>
                )}
                <p className="text-lg font-bold text-blue-500 mb-3">
                  {product.price} TL
                </p>
                <p className="text-xs text-gray-500">
                  Category: {product.category}
                </p>
                <p className="text-xs text-gray-500">
                  Stock: {product.stockQuantity}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
