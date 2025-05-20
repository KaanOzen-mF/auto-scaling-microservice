// stock-service/src/index.test.ts
import { Request, Response } from "express";
import {
  getStockByProductIdHandler,
  updateStockHandler,
  listAllStockHandler,
  stockLevels,
} from "./index"; // ./index.ts'ten

describe("Stock Service Handlers", () => {
  describe("getStockByProductIdHandler", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let responseJsonPayload: any;

    const testProductId = "test-product-123";
    const initialStock = 50;

    beforeEach(() => {
      // Before test, clean up stockLevels and set to known state
      for (const key in stockLevels) {
        // clean up stockLevels
        delete stockLevels[key];
      }
      stockLevels[testProductId] = initialStock; // add stock record for testing

      mockRequest = {
        params: {},
      };
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((payload) => {
          responseJsonPayload = payload;
        }),
      };
    });

    it("should return 200 and stock data if productId exists", () => {
      mockRequest.params = { productId: testProductId };

      getStockByProductIdHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseJsonPayload).toEqual({
        productId: testProductId,
        quantity: initialStock,
      });
    });

    it("should return 404 if productId does not exist in stockLevels", () => {
      const nonExistentId = "non-existent-id-456";
      mockRequest.params = { productId: nonExistentId };

      getStockByProductIdHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseJsonPayload.message).toBe(
        `Stock information not found for product ID: ${nonExistentId}`
      );
    });
  });
  describe("updateStockHandler", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let responseJsonPayload: any;

    const existingProductId = "product-abc-123";
    const newProductId = "product-xyz-789";

    beforeEach(() => {
      for (const key in stockLevels) {
        delete stockLevels[key];
      }
      stockLevels[existingProductId] = 20;

      mockRequest = {
        params: {},
        body: {},
      };
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((payload) => {
          responseJsonPayload = payload;
        }),
      };
    });

    it("should update stock for an existing productId and return 200", () => {
      mockRequest.params = { productId: existingProductId };
      mockRequest.body = { quantity: 25 };

      updateStockHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseJsonPayload).toEqual({
        productId: existingProductId,
        quantity: 25,
      });
      expect(stockLevels[existingProductId]).toBe(25);
    });

    it("should create stock for a new productId and return 200 (upsert behavior)", () => {
      mockRequest.params = { productId: newProductId };
      mockRequest.body = { quantity: 10 };

      updateStockHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseJsonPayload).toEqual({
        productId: newProductId,
        quantity: 10,
      });
      expect(stockLevels[newProductId]).toBe(10);
    });

    it("should return 400 if quantity is missing in request body", () => {
      mockRequest.params = { productId: existingProductId };
      mockRequest.body = {};

      updateStockHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseJsonPayload.message).toBe(
        'Missing "quantity" in request body.'
      );
    });

    it("should return 400 if quantity is not a non-negative integer", () => {
      mockRequest.params = { productId: existingProductId };
      mockRequest.body = { quantity: -5 };

      updateStockHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseJsonPayload.message).toBe(
        '"quantity" must be a non-negative integer.'
      );
    });

    it("should return 400 if quantity is not a number", () => {
      mockRequest.params = { productId: existingProductId };
      mockRequest.body = { quantity: "not-a-number" };

      updateStockHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseJsonPayload.message).toBe(
        '"quantity" must be a non-negative integer.'
      );
    });
  });
  describe("listAllStockHandler", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let responseJsonPayload: any;

    const sampleStockData = {
      "product-aaa": 10,
      "product-bbb": 20,
      "product-ccc": 30,
      "product-ddd": 40,
      "product-eee": 50,
    };

    beforeEach(() => {
      for (const key in stockLevels) {
        delete stockLevels[key];
      }
      Object.assign(stockLevels, sampleStockData);

      mockRequest = {
        query: {},
      };
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((payload) => {
          responseJsonPayload = payload;
        }),
      };
    });

    afterEach(() => {
      for (const key in stockLevels) {
        delete stockLevels[key];
      }
    });

    it("should return all stock items with default pagination when stockLevels is not empty", () => {
      listAllStockHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseJsonPayload.data.length).toBe(5);
      expect(responseJsonPayload.pagination.totalItems).toBe(5);
      expect(responseJsonPayload.pagination.totalPages).toBe(1);
      expect(responseJsonPayload.pagination.currentPage).toBe(1);
      expect(responseJsonPayload.data).toContainEqual({
        productId: "product-aaa",
        quantity: 10,
      });
    });

    it("should return paginated stock items correctly (e.g., page 2, limit 2)", () => {
      mockRequest.query = { page: "2", limit: "2" };
      listAllStockHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseJsonPayload.data.length).toBe(2);
      expect(responseJsonPayload.pagination.currentPage).toBe(2);
      expect(responseJsonPayload.pagination.totalPages).toBe(3);
      expect(responseJsonPayload.pagination.limit).toBe(2);
      const productC = responseJsonPayload.data.find(
        (p: any) => p.productId === "product-ccc"
      );
      const productD = responseJsonPayload.data.find(
        (p: any) => p.productId === "product-ddd"
      );
      expect(productC || productD).toBeDefined();
    });

    it("should return an empty list when page requested is out of bounds", () => {
      mockRequest.query = { page: "10", limit: "2" };

      listAllStockHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseJsonPayload.data.length).toBe(0);
      expect(responseJsonPayload.pagination.currentPage).toBe(10);
      expect(responseJsonPayload.pagination.totalPages).toBe(3);
    });

    it("should return 400 if page parameter is invalid", () => {
      mockRequest.query = { page: "invalid" };
      listAllStockHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseJsonPayload.message).toBe(
        "Invalid pagination parameters. Page and limit must be positive numbers."
      );
    });
  });
});
