import express, {
  Request,
  Response,
  Application,
  RequestHandler,
} from "express";

import cors from "cors";

const app: Application = express();

const port: number = 3001;

app.use(cors()); // Enable CORS for all routes
app.use(express.json());

interface StockData {
  [productId: string]: number;
}

export const stockLevels: StockData = {
  "71cb9bea-6e6e-42d5-a191-e28ad09b1e7b": 25, // Laptop Pro 15 inch
  "1fa7b950-5b2f-4742-a995-17c99022dc12": 150, // Wireless Mouse Ergo
};

export const listAllStockHandler: RequestHandler = (req, res) => {
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
      return;
    }

    // Convert stockLevels object to an array of {productId, quantity} objects
    const allStockItems = Object.keys(stockLevels).map((productId) => {
      return { productId: productId, quantity: stockLevels[productId] };
    });

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const results = allStockItems.slice(startIndex, endIndex);
    const totalItems = allStockItems.length;
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
    console.error("Error listing all stock:", error);
    res
      .status(500)
      .json({ message: "Server error: Could not list all stock information." });
  }
};

export const getStockByProductIdHandler: RequestHandler = (req, res) => {
  try {
    const { productId } = req.params;

    if (stockLevels[productId] !== undefined) {
      res.status(200).json({
        productId: productId,
        quantity: stockLevels[productId],
      });
    } else {
      res.status(404).json({
        message: `Stock information not found for product ID: ${productId}`,
      });
    }
  } catch (error) {
    console.error(
      `Error fetching stock for product ID ${req.params.productId}:`,
      error
    );
    res
      .status(500)
      .json({ message: "Server error: Could not fetch stock information." });
  }
};

export const updateStockHandler: RequestHandler = (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body; // Expecting { "quantity": number } in the request body

    // Validate quantity
    if (quantity === undefined) {
      res.status(400).json({ message: 'Missing "quantity" in request body.' });
      return; // Exit
    }
    if (
      typeof quantity !== "number" ||
      quantity < 0 ||
      !Number.isInteger(quantity)
    ) {
      res
        .status(400)
        .json({ message: '"quantity" must be a non-negative integer.' });
      return; // Exit
    }

    // Update or set the stock level for the productId
    stockLevels[productId] = quantity;

    console.log(`Stock updated for product ID ${productId}:`, { quantity });
    res.status(200).json({
      productId: productId,
      quantity: stockLevels[productId],
    });
  } catch (error) {
    console.error(
      `Error updating stock for product ID ${req.params.productId}:`,
      error
    );
    res
      .status(500)
      .json({ message: "Server error: Could not update stock information." });
  }
};

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World! Stock Service is running.");
});

app.get("/stock", listAllStockHandler);
app.get("/stock/:productId", getStockByProductIdHandler);
app.put("/stock/:productId", updateStockHandler);

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

export default app;
