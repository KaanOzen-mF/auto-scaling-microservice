import express, {
  Request,
  Response,
  Application,
  RequestHandler,
} from "express";
// Import a function to generate unique IDs
import { v4 as uuidv4 } from "uuid";

// Import the CORS middleware to allow cross-origin requests (e.g., from a frontend).
import cors from "cors";

// Import the official Prometheus client for Node.js to create and expose custom metrics.
import client from "prom-client";

// --- Basic Express App Setup ---

// Create an instance of an Express application.
const app: Application = express();

// Define the port the server will listen on. Use the PORT environment variable if available,
// otherwise default to 3000.
const port: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Enable the CORS middleware for all incoming requests. This adds the necessary
// headers to allow a web frontend (running on a different origin) to make API calls.
app.use(cors());

// Enable the express.json() middleware. This parses incoming requests with JSON payloads
// (e.g., from POST/PUT requests) and makes the parsed data available on `req.body`.
app.use(express.json());

// --- Prometheus Metrics Instrumentation ---

// Enable the collection of default metrics provided by prom-client.
// This includes metrics about CPU usage, memory, event loop lag, etc., for the Node.js process.
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

// Create a custom Prometheus Counter metric to track the total number of HTTP requests.
const httpRequestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  // 'labelNames' allow us to slice and dice the metric data by different dimensions.
  labelNames: ["method", "route", "status"], // Changed 'status' to 'status_code' for clarity
});

// Create a custom Prometheus Histogram metric to track the duration of HTTP requests.
// Histograms are useful for calculating percentiles (e.g., p95, p99 latency).
const httpRequestDurationHistogram = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.1, 0.5, 1, 1.5, 2, 5], // 'buckets' define the time ranges (in seconds) for grouping request durations.
});

// Custom Express middleware to intercept all requests and record metrics.
// This middleware must be defined before the routes to ensure it runs for every request.
app.use((req, res, next) => {
  // Start a timer for the request duration histogram.
  const end = httpRequestDurationHistogram.startTimer();

  // Use the 'finish' event on the response object, which is fired when the response is sent.
  res.on("finish", () => {
    // Determine the route path. `req.route.path` provides the matched pattern (e.g., /products/:id).
    // If no route is matched, it falls back to the raw URL path.
    const route = req.route ? req.route.path : req.path; // Route'u al

    // Increment the request counter with the appropriate labels.
    httpRequestCounter.inc({
      method: req.method,
      route: route,
      status: res.statusCode,
    });

    // End the timer and record the duration for the corresponding route and method.
    end({ method: req.method, route: route });
  });

  // Pass control to the next middleware or route handler in the chain.
  next();
});

// --- Data Model and In-Memory Storage ---

// Defines the data structure for a Product object using a TypeScript interface for type safety.
export interface Product {
  id: string;
  name: string;
  description: string;
  detailedDescription?: string;
  imageUrl: string;
  price: number;
  stockQuantity: number;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

// An array of sample products to pre-populate the application on startup.
// This is useful for demonstration and testing purposes.
export let sampleProducts: Product[] = [
  {
    id: uuidv4(),
    name: "Laptop Pro 15 inch",
    description: "High performance laptop for professionals.",
    detailedDescription:
      "This 15-inch Laptop Pro features the latest generation processor, a stunning Retina display, and all-day battery life. Perfect for creative professionals and developers.",
    imageUrl:
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
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
    imageUrl:
      "https://images.unsplash.com/photo-1527814050087-3793815479db?q=80&w=1928&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
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
    imageUrl:
      "https://images.unsplash.com/photo-1651168251177-32b5138220dc?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
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
    imageUrl:
      "https://images.unsplash.com/photo-1576935429524-1df7fb127097?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
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
    imageUrl:
      "https://images.unsplash.com/photo-1548544027-1a96c4c24c7a?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    price: 29.99,
    stockQuantity: 200,
    category: "Accessories",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 gün önce
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 gün önce
  },
];

// This array serves as our in-memory "database". In a real application, this would be
// replaced with a connection to a persistent database like PostgreSQL or MongoDB.
// It's exported so our unit tests can access and manipulate it.
export let products: Product[] = [...sampleProducts];

// --- Route Handlers (Business Logic) ---
/**
 * Handles the creation of a new product.
 * Expects product data in the request body.
 * Validates the input and adds the new product to the in-memory array.
 */
export const createProductHandler: RequestHandler = (req, res) => {
  try {
    const {
      name,
      description,
      detailedDescription,
      price,
      stockQuantity,
      category,
      imageUrl,
    } = req.body;

    if (
      !name ||
      !description ||
      price === undefined ||
      stockQuantity === undefined ||
      !category ||
      !imageUrl
    ) {
      res.status(400).json({
        message:
          "Please provide all required fields: name, description, price, stockQuantity, category, imageUrl",
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
      detailedDescription,
      price,
      stockQuantity,
      category,
      imageUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    products.push(newProduct);
    res.status(201).json(newProduct);
  } catch (error) {
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

    const results = products.slice(startIndex, endIndex).map((p) => ({ ...p }));
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
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    res.status(500).json({ message: "Server error: Could not fetch product." });
  }
};

// Handler for updating an existing product (PUT /products/:id)
export const updateProductHandler: RequestHandler = (req, res) => {
  try {
    const productId = req.params.id;
    const {
      name,
      description,
      price,
      stockQuantity,
      category,
      detailedDescription,
      imageUrl,
    } = req.body;

    // Basic validation for request body
    if (
      !name ||
      !description ||
      price === undefined ||
      stockQuantity === undefined ||
      !category ||
      !imageUrl
    ) {
      res.status(400).json({
        message:
          "Please provide all required fields for update: name, description, price, stockQuantity, category, imageUrl", // imageUrl eklendi
      });
      return;
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
        detailedDescription: detailedDescription,
        imageUrl: imageUrl,
        price: price,
        stockQuantity: stockQuantity,
        category: category,
        updatedAt: new Date(), // Set new updatedAt timestamp
      };

      // Replace the old product with the updated product in the array
      products[productIndex] = updatedProduct;

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

// --- Route Definitions ---
// A simple root endpoint to confirm the service is running.
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World! Product Service is running.");
});
// A simple health check or debug endpoint.
app.get("/ping", (req, res) => {
  res.status(200).send("Ping!");
});

// The endpoint that Prometheus will scrape to collect our custom and default metrics.
app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
  } catch (error) {
    console.error("Error occurred when generating metrics:", error);
    res.status(500).send("Error generating metrics");
  }
});

// Assigning the handler functions to the specific API routes and HTTP methods.
app.post("/products", createProductHandler);
app.get("/products", listProductsHandler);
app.get("/products/:id", getProductByIdHandler);
app.put("/products/:id", updateProductHandler);
app.delete("/products/:id", deleteProductHandler);

// --- Server Initialization ---

// Conditionally start the server. This prevents the server from starting automatically
// when the file is imported by Jest during testing.
if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

export default app; // Export the app for testing purposes
