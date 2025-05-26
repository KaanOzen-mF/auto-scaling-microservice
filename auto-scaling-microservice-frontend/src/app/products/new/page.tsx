"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

type NewProductData = {
  name: string;
  description: string;
  detailedDescription?: string;
  imageUrl: string;
  price: number;
  stockQuantity: number;
  category: string;
};

export default function NewProductPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<NewProductData>({
    name: "",
    description: "",
    detailedDescription: "",
    imageUrl: "",
    price: 0,
    stockQuantity: 0,
    category: "",
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const PRODUCT_SERVICE_BASE_API_URL = "http://127.0.0.1:51674/products";

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
      setError("Product Service API URL is not valid. Please check the URL.");
      setIsSubmitting(false);
      return;
    }

    if (
      !formData.name ||
      !formData.description ||
      !formData.imageUrl ||
      formData.price <= 0 ||
      formData.stockQuantity < 0 ||
      !formData.category
    ) {
      setError("Please fill in all required(*) fields.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${PRODUCT_SERVICE_BASE_API_URL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Product not created: ${response.status}`
        );
      }

      const newProductData: Product = await response.json();
      setSuccessMessage(
        `New product created successfully ID: ${newProductData.id}. Redirecting...`
      );
      setFormData({
        name: "",
        description: "",
        detailedDescription: "",
        imageUrl: "",
        price: 0,
        stockQuantity: 0,
        category: "",
      });

      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="container mx-auto p-4 ">
      <div className="flex justify-between items-center mb-6 ">
        <h1 className="text-3xl font-bold">Add new product</h1>
        <Link
          href="/"
          className="text-white text-2xl hover:text-amber-400 hover:underline"
        >
          &larr; Back to Products
        </Link>
      </div>

      {error && (
        <p className="bg-red-100 text-red-700 p-3 mb-4 rounded-lg">{error}</p>
      )}
      {successMessage && (
        <p className="bg-green-100 text-green-700 p-3 mb-4 rounded-lg">
          {successMessage}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 max-w-2xl mx-auto p-6 rounded-lg backdrop-blur-m bg-gray-600"
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
            Long Description
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
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="price"
              className="block text-sm font-medium text-shadow-white"
            >
              Fiyat <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="price"
              id="price"
              value={formData.price}
              onChange={handleChange}
              required
              step="0.01"
              min="0"
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
              min="0"
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
          disabled={isSubmitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-900 
          hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2  disabled:bg-gray-300 hover:cursor-pointer"
        >
          {isSubmitting ? "Adding..." : "Add New Product"}
        </button>
      </form>
    </main>
  );
}
