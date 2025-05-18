import express, {
  Request,
  Response,
  Application,
  RequestHandler,
} from "express";
import { v4 as uuidv4 } from "uuid";

const app: Application = express();
const port: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

// Sample data for products
export let sampleProducts: Product[] = [
  {
    id: uuidv4(),
    name: "Laptop Pro 15 inch",
    description: "High performance laptop for professionals.",
    price: 1499.99,
    stockQuantity: 25,
    category: "Electronics",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 gün önce
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 gün önce
  },
  {
    id: uuidv4(),
    name: "Wireless Mouse Ergo",
    description: "Ergonomic wireless mouse with long battery life.",
    price: 39.99,
    stockQuantity: 150,
    category: "Accessories",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 gün önce
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 gün önce
  },
  {
    id: uuidv4(),
    name: "Mechanical Keyboard RGB",
    description: "RGB backlit mechanical keyboard with blue switches.",
    price: 89.9,
    stockQuantity: 75,
    category: "Peripherals",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 gün önce
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 gün önce (güncellenmemiş)
  },
  {
    id: uuidv4(),
    name: "4K UHD Monitor 27 inch",
    description: "27 inch 4K UHD monitor with vibrant colors.",
    price: 349.5,
    stockQuantity: 40,
    category: "Monitors",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 gün önce
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 gün önce
  },
  {
    id: uuidv4(),
    name: "USB-C Hub 7-in-1",
    description: "Versatile USB-C hub with multiple ports.",
    price: 29.99,
    stockQuantity: 200,
    category: "Accessories",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 gün önce
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 gün önce
  },
];

export let products: Product[] = [...sampleProducts]; // Array to store products in memory

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World! Product Service is running.");
});

// Handler for creating a new product (POST /products)
export const createProductHandler: RequestHandler = (req, res) => {
  try {
    console.log("TEST DEBUG - req.body:", req.body); //
    const { name, description, price, stockQuantity, category } = req.body;

    if (
      !name ||
      !description ||
      price === undefined ||
      stockQuantity === undefined ||
      !category
    ) {
      res.status(400).json({
        message:
          "Please provide all required fields: name, description, price, stockQuantity, category",
      });
      return; // Exit after sending response
    }
    if (typeof price !== "number" || typeof stockQuantity !== "number") {
      res
        .status(400)
        .json({ message: "Fields price and stockQuantity must be numbers." });
      return; // Exit after sending response
    }

    const newProduct: Product = {
      id: uuidv4(),
      name,
      description,
      price,
      stockQuantity,
      category,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    products.push(newProduct);
    console.log("New product added:", newProduct);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ message: "Server error: Could not add product." });
  }
};

// Handler for listing products (GET /products)
export const listProductsHandler: RequestHandler = (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 10;

    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
      res.status(400).json({
        message:
          "Invalid pagination parameters. Page and limit must be positive numbers.",
      });
      return; // Exit after sending response
    }

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const results = products.slice(startIndex, endIndex);
    const totalItems = products.length;
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      data: results,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
        limit: limit,
        hasNextPage: endIndex < totalItems,
        hasPreviousPage: startIndex > 0,
      },
    });
  } catch (error) {
    console.error("Error listing products:", error);
    res.status(500).json({ message: "Server error: Could not list products." });
  }
};

// Handler for getting a product by ID (GET /products/:id)
export const getProductByIdHandler: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const product = products.find((p) => p.id === id);

    if (product) {
      res.status(200).json(product);
      return; // Exit after sending response
    } else {
      res.status(404).json({ message: `Product with id '${id}' not found.` });
      return; // Exit after sending response
    }

    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    res.status(500).json({ message: "Server error: Could not fetch product." });
  }
};

// Handler for updating an existing product (PUT /products/:id)
export const updateProductHandler: RequestHandler = (req, res) => {
  try {
    const productId = req.params.id;
    const { name, description, price, stockQuantity, category } = req.body;

    // Basic validation for request body
    if (
      !name ||
      !description ||
      price === undefined ||
      stockQuantity === undefined ||
      !category
    ) {
      res.status(400).json({
        message:
          "Please provide all required fields for update: name, description, price, stockQuantity, category",
      });
      return; // Exit after sending response
    }
    if (typeof price !== "number" || typeof stockQuantity !== "number") {
      res
        .status(400)
        .json({ message: "Fields price and stockQuantity must be numbers." });
      return; // Exit after sending response
    }

    // Find the index of the product to update
    const productIndex = products.findIndex((p) => p.id === productId);

    if (productIndex !== -1) {
      // Product found, create the updated product object
      const updatedProduct: Product = {
        ...products[productIndex], // Preserve original id and createdAt
        name: name,
        description: description,
        price: price,
        stockQuantity: stockQuantity,
        category: category,
        updatedAt: new Date(), // Set new updatedAt timestamp
      };

      // Replace the old product with the updated product in the array
      products[productIndex] = updatedProduct;

      console.log("Product updated:", updatedProduct);
      res.status(200).json(updatedProduct);
    } else {
      res.status(404).json({
        message: `Product with id '${productId}' not found, cannot update.`,
      });
    }
  } catch (error) {
    console.error("Error updating product:", error);
    res
      .status(500)
      .json({ message: "Server error: Could not update product." });
  }
};

// Handler for deleting a product by ID (DELETE /products/:id)
export const deleteProductHandler: RequestHandler = (req, res) => {
  try {
    const productId = req.params.id;

    // Find the index of the product to delete
    const productIndex = products.findIndex((p) => p.id === productId);

    if (productIndex !== -1) {
      // Product found, remove it from the array
      const deletedProduct = products.splice(productIndex, 1); // splice returns an array of deleted items
      console.log("Product deleted:", deletedProduct[0]);
      res.status(204).send(); // 204 No Content for successful deletion
      // .send() is used as .json() is not appropriate for 204
    } else {
      res.status(404).json({
        message: `Product with id '${productId}' not found, cannot delete.`,
      });
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    res
      .status(500)
      .json({ message: "Server error: Could not delete product." });
  }
};

// Assign handlers to routes
app.post("/products", createProductHandler);
app.get("/products", listProductsHandler);

app.get("/products/:id", getProductByIdHandler);
app.put("/products/:id", updateProductHandler);

app.delete("/products/:id", deleteProductHandler);

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

export default app; // Export the app for testing purposes
