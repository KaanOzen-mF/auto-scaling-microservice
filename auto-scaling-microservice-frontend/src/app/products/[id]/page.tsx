"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  description: string;
  detailedDescription?: string;
  imageUrl: string;
  price: number;
  stockQuantity: number;
  category: string;
  createdAt?: string;
  updatedAt?: string;
}

type ProductFormData = {
  name: string;
  description: string;
  detailedDescription?: string;
  imageUrl: string;
  price: number;
  stockQuantity: number;
  category: string;
};

export default function ProductEditPage() {
  const params = useParams();
  //const router = useRouter();
  const id = params.id as string;

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    detailedDescription: "",
    imageUrl: "",
    price: 0,
    stockQuantity: 0,
    category: "",
  });
  const [originalProduct, setOriginalProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const PRODUCT_SERVICE_BASE_API_URL = "http://127.0.0.1:51674";

  useEffect(() => {
    if (id && PRODUCT_SERVICE_BASE_API_URL.includes(":")) {
      const fetchProduct = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(
            `${PRODUCT_SERVICE_BASE_API_URL}/products/${id}`
          );
          if (!response.ok) {
            if (response.status === 404)
              throw new Error("Can not find product.");
            throw new Error(`API request is fail: ${response.status}`);
          }
          const data: Product = await response.json();
          setOriginalProduct(data);
          setFormData({
            name: data.name,
            description: data.description,
            detailedDescription: data.detailedDescription || "",
            imageUrl: data.imageUrl,
            price: data.price,
            stockQuantity: data.stockQuantity,
            category: data.category,
          });
        } catch (err: unknown) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("An unknown error occurred");
          }
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    } else if (!PRODUCT_SERVICE_BASE_API_URL.includes(":")) {
      setError("Product Service API URL is not valid. Please check the URL.");
      setLoading(false);
    }
  }, [id, PRODUCT_SERVICE_BASE_API_URL]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "price" || name === "stockQuantity"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    if (!PRODUCT_SERVICE_BASE_API_URL.includes(":")) {
      setError("Product Service API URL is not valid.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(
        `${PRODUCT_SERVICE_BASE_API_URL}/products/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Update failed: ${response.status}`
        );
      }

      const updatedProductData: Product = await response.json();
      setSuccessMessage(
        `Product updated successfully! (ID: ${updatedProductData.id})`
      );
      setOriginalProduct(updatedProductData);

      setFormData({
        name: updatedProductData.name,
        description: updatedProductData.description,
        detailedDescription: updatedProductData.detailedDescription || "",
        imageUrl: updatedProductData.imageUrl,
        price: updatedProductData.price,
        stockQuantity: updatedProductData.stockQuantity,
        category: updatedProductData.category,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <p className="text-center p-8">Product information...</p>;
  if (error && !originalProduct)
    return (
      <p className="text-center text-red-500 p-8">
        Hata: {error}{" "}
        <Link href="/" className="text-blue-500 hover:underline">
          Back to Product
        </Link>
      </p>
    );
  if (!originalProduct)
    return (
      <p className="text-center p-8">
        Can not find product.
        <Link href="/" className="text-blue-500 hover:underline">
          Back to Product
        </Link>
      </p>
    );

  return (
    <main className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Edit products</h1>
        <Link
          href="/"
          className="text-white text-2xl hover:text-amber-400 hover:underline"
        >
          &larr; Back to products
        </Link>
      </div>

      {error && (
        <p className="bg-red-100 text-red-700 p-3 mb-4 rounded_lg">{error}</p>
      )}
      {successMessage && (
        <p className="bg-green-100 text-green-700 p-3 mb-4 rounded_lg">
          {successMessage}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 max-w-2xl mx-auto p-6 shadow-xl rounded_lg border border-gray-200"
      >
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-shadow-white"
          >
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            id="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 bg-white/4 border border-gray-300 rounded-md shadow-sm
              focus:outline-none focus:bg-white/20 focus:border-amber-400 transition-colors duration-200"
          />
        </div>
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-shadow-white"
          >
            Short Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            id="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={2}
            className="mt-1 block w-full px-3 py-2 bg-white/4 border border-gray-300 rounded-md shadow-sm
              focus:outline-none focus:bg-white/20 focus:border-amber-400 transition-colors duration-200"
          ></textarea>
        </div>
        <div>
          <label
            htmlFor="detailedDescription"
            className="block text-sm font-medium text-shadow-white"
          >
            Detailed Description
          </label>
          <textarea
            name="detailedDescription"
            id="detailedDescription"
            value={formData.detailedDescription || ""}
            onChange={handleChange}
            rows={4}
            className="mt-1 block w-full px-3 py-2 bg-white/4 border border-gray-300 rounded-md shadow-sm
              focus:outline-none focus:bg-white/20 focus:border-amber-400 transition-colors duration-200"
          ></textarea>
        </div>
        <div>
          <label
            htmlFor="imageUrl"
            className="block text-sm font-medium text-shadow-white"
          >
            Image URL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            name="imageUrl"
            id="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 bg-white/4 border border-gray-300 rounded-md shadow-sm
              focus:outline-none focus:bg-white/20 focus:border-amber-400 transition-colors duration-200"
          />
          {formData.imageUrl && (
            <Image
              src={formData.imageUrl}
              alt="Product Image"
              className="mt-2 rounded max-h-40"
              width={300}
              height={200}
            />
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="price"
              className="block text-sm font-medium text-shadow-white"
            >
              Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="price"
              id="price"
              value={formData.price}
              onChange={handleChange}
              required
              step="0.01"
              className="mt-1 block w-full px-3 py-2 bg-white/4 border border-gray-300 rounded-md shadow-sm
              focus:outline-none focus:bg-white/20 focus:border-amber-400 transition-colors duration-200"
            />
          </div>
          <div>
            <label
              htmlFor="stockQuantity"
              className="block text-sm font-medium text-shadow-white"
            >
              Stock Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="stockQuantity"
              id="stockQuantity"
              value={formData.stockQuantity}
              onChange={handleChange}
              required
              step="1"
              className="mt-1 block w-full px-3 py-2 bg-white/4 border border-gray-300 rounded-md shadow-sm
              focus:outline-none focus:bg-white/20 focus:border-amber-400 transition-colors duration-200"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-shadow-white"
          >
            Category <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="category"
            id="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 bg-white/4 border border-gray-300 rounded-md shadow-sm
              focus:outline-none focus:bg-white/20 focus:border-amber-400 transition-colors duration-200"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting || loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-900 
          hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-gray-300 hover:cursor-pointer"
        >
          {isSubmitting ? "Updating..." : "Save Changes"}
        </button>
      </form>
    </main>
  );
}
