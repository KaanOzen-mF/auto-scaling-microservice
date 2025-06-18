"use client";
import Image from "next/image";
import Link from "next/link";
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const PRODUCT_SERVICE_API_URL = "http://127.0.0.1:52013/products";

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
        console.error("When getting products error occurred:", err);
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

  const handleDeleteProduct = async (productId: string) => {
    if (
      !window.confirm(
        `"${productId}" ID's product will be deleted. Are you sure?`
      )
    ) {
      return;
    }

    setActionMessage(null);
    setError(null);

    if (!PRODUCT_SERVICE_API_URL.includes(":")) {
      setError("Product Service API URL is not valid.");
      return;
    }

    try {
      const response = await fetch(`${PRODUCT_SERVICE_API_URL}/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            `Product can not find (ID: ${productId}). Not deleted.`
          );
        }
        throw new Error(`Delete is failed ${response.status}`);
      }

      if (response.status === 204) {
        setProducts((prevProducts) =>
          prevProducts.filter((p) => p.id !== productId)
        );
        setActionMessage(`Product (ID: ${productId}) deleted successfully.`);
      } else {
        setActionMessage(`Unexpected status ${response.status}`);
      }
    } catch (err: unknown) {
      console.error("Error occurred when adding new product", err);
      setError(
        err instanceof Error ? err.message : "Product can not be deleted."
      );
    }
  };

  return (
    <main className="container mx-auto p-4">
      <div className="flex flex-row items-center mb-8 justify-between text-3xl font-bold text-center text-blue-600 w-2xl object-center mx-auto">
        <Link href={"/"}>Products</Link>
        <Link href={"/demo"}>Demo Codes</Link>
      </div>

      {loading && (
        <p className="text-center text-gray-500">Products loading..</p>
      )}
      {error && <p className="text-center text-red-500">Error: {error}</p>}

      {!loading && !error && products.length === 0 && (
        <p className="text-center text-gray-700">
          No products found. Please check the API URL or try again later.
        </p>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 items-stretch">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex flex-col h-full rounded-lg shadow-md shadow-amber-50 overflow-hidden hover:shadow-lg 
              transition-shadow duration-300 bg-gray-400"
            >
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={300}
                height={200}
                className="w-full h-48 object-cover shadow"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://via.placeholder.com/300x200.png?text=Resim+Yok";
                }}
              />
              <div className="p-4">
                <h2
                  className="text-2xl font-bold mb-2 truncate text-shadow-sm"
                  title={product.name}
                >
                  {product.name}
                </h2>
                <p
                  className="text-gray-800 flex-grow text-md mb-1 truncate"
                  title={product.description}
                >
                  {product.description}
                </p>
                {product.detailedDescription && (
                  <p
                    className="text-gray-700 text-sm mb-3 truncate"
                    title={product.detailedDescription}
                  >
                    {product.detailedDescription}
                  </p>
                )}
                <p className="text-2xl font-bold text-blue-950 mb-3 text-right text-shadow-xs">
                  {product.price} TL
                </p>
                <p className="text-sm text-gray-600 text-right">
                  Category: {product.category}
                </p>
                <p className="text-sm text-gray-600 text-right">
                  Stock: {product.stockQuantity}
                </p>
              </div>
              <div className="flex space-x-2 mt-auto px-4 py-4">
                <Link
                  href={`/products/${product.id}`}
                  className="flex-1 text-center text-md text-white bg-blue-900 hover:bg-blue-700 py-1 px-3 rounded transition-colors duration-200 cursor-pointer shadow"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="flex-1 text-md text-white bg-red-700 hover:bg-red-500 py-1 px-3 rounded transition-colors duration-200 cursor-pointer shadow"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          <Link
            href="/products/new"
            className="justify-self-center self-end bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
          >
            + Add New Product
          </Link>
        </div>
      )}
    </main>
  );
}
