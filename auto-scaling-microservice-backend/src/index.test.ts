// Import Request and Response types from Express to be used in mock objects.
import { Request, Response } from "express";

// Import the handlers and other necessary components from our main application file (index.ts).
import {
  createProductHandler,
  products, // The in-memory array used as a database, imported for state verification and reset.
  Product, // The TypeScript interface for a Product, used for type safety in tests.
  listProductsHandler,
  getProductByIdHandler,
  updateProductHandler,
  deleteProductHandler,
} from "./index";

// Import the uuid library to generate unique IDs for test data.
import { v4 as uuid } from "uuid";

// The main test suite for all handlers related to the Product API.
describe("Product API Handlers", () => {
  // Common mock objects to be used across multiple tests within this suite.
  let mockRequest: Partial<Request>; // A partial mock of the Express Request object.
  let mockResponse: Partial<Response>; // A partial mock of the Express Response object.
  let responseJsonPayload: any; // A variable to capture the payload sent via res.json().

  // Test suite for the createProductHandler function.
  describe("createProductHandler", () => {
    // A setup function that runs before each test case ('it' block) in this suite.
    beforeEach(() => {
      // Reset the state: Clear the in-memory products array to ensure tests are isolated.
      products.length = 0;
      // Initialize a fresh mock request object for each test.
      mockRequest = { body: {} };
      // Reset the payload catcher.
      responseJsonPayload = {};
      // Initialize a fresh mock response object for each test.
      mockResponse = {
        // Mock the .status() method. jest.fn() creates a mock function.
        // .mockReturnThis() allows chaining, so we can call .json() after .status().
        status: jest.fn().mockReturnThis(),
        // Mock the .json() method.
        // .mockImplementation() defines what the mock function does when called.
        // Here, it captures the payload passed to it so we can assert against it later.
        json: jest.fn().mockImplementation((payload) => {
          responseJsonPayload = payload;
        }),
      };
    });

    // Test case for the "happy path": creating a product with all valid fields.
    it("should create a new product with all fields (including mandatory imageUrl) and return 201", () => {
      // Arrange: Set up the mock request body with all necessary and optional data.
      mockRequest.body = {
        name: "Super Laptop Pro",
        description: "Top-tier laptop for professionals",
        detailedDescription:
          "This laptop features an M3 Max chip and 32GB RAM.", // Optional field
        price: 2499.99,
        stockQuantity: 15,
        category: "Electronics",
        imageUrl: "https://example.com/super-laptop-pro.jpg", // Mandatory field
      };

      // Act: Call the handler function with the mocked request, response, and a mock 'next' function.
      createProductHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      // Assert: Verify that the outcomes are as expected.
      expect(mockResponse.status).toHaveBeenCalledWith(201); // Check if the HTTP status was set to 201 (Created).
      expect(responseJsonPayload.id).toBeDefined(); // The new product should have a server-generated ID.
      expect(responseJsonPayload.name).toBe(mockRequest.body.name);
      expect(responseJsonPayload.description).toBe(
        mockRequest.body.description
      );
      expect(responseJsonPayload.detailedDescription).toBe(
        mockRequest.body.detailedDescription
      );
      expect(responseJsonPayload.price).toBe(mockRequest.body.price);
      expect(responseJsonPayload.stockQuantity).toBe(
        mockRequest.body.stockQuantity
      );
      expect(responseJsonPayload.category).toBe(mockRequest.body.category);
      expect(responseJsonPayload.imageUrl).toBe(mockRequest.body.imageUrl);
      expect(responseJsonPayload.createdAt).toBeDefined();
      expect(responseJsonPayload.updatedAt).toBeDefined();

      // Assert the side effect: the product should be added to the in-memory array.
      expect(products.length).toBe(1);
      expect(products[0].name).toBe(mockRequest.body.name);
      expect(products[0].imageUrl).toBe(mockRequest.body.imageUrl);
    });

    // Test case: creating a product where optional fields are omitted.
    it("should create a product if optional detailedDescription is missing but mandatory imageUrl is present, and return 201", () => {
      // Arrange: provide only the mandatory fields.
      mockRequest.body = {
        name: "Standard Laptop",
        description: "Reliable laptop for daily use",
        // 'detailedDescription' is omitted.
        price: 799.99,
        stockQuantity: 30,
        category: "Electronics",
        imageUrl: "https://example.com/standard-laptop.jpg",
      };

      // Act
      createProductHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(responseJsonPayload.name).toBe(mockRequest.body.name);
      expect(responseJsonPayload.imageUrl).toBe(mockRequest.body.imageUrl);
      expect(responseJsonPayload.detailedDescription).toBeUndefined(); // Verify the optional field is undefined.
      expect(products.length).toBe(1);
      expect(products[0].detailedDescription).toBeUndefined();
    });

    // Test case: request is missing a mandatory field (imageUrl).
    it("should return 400 if mandatory imageUrl is missing", () => {
      // Arrange: create a request body without the 'imageUrl' field.
      mockRequest.body = {
        name: "Product Without Image",
        description: "This product is missing its image URL",
        price: 50.0,
        stockQuantity: 5,
        category: "Testing",
      };
      // Act
      createProductHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400); // Expect a 'Bad Request' status.
      // Assert that the error message correctly identifies the missing fields.
      expect(responseJsonPayload.message).toBe(
        "Please provide all required fields: name, description, price, stockQuantity, category, imageUrl"
      );
      expect(products.length).toBe(0); // No product should have been added.
    });

    // Test case: request is missing another mandatory field (name).
    it("should return 400 if other required fields (e.g., name) are missing", () => {
      // Arrange
      mockRequest.body = {
        // 'name' field is missing.
        description: "A product without a name",
        price: 9.99,
        stockQuantity: 10,
        category: "Incomplete",
        imageUrl: "https://example.com/incomplete.jpg",
      };
      // Act
      createProductHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseJsonPayload.message).toBe(
        "Please provide all required fields: name, description, price, stockQuantity, category, imageUrl"
      );
      expect(products.length).toBe(0);
    });

    // Test case: request has data with an incorrect type (price as string).
    it("should return 400 if price is not a number", () => {
      // Arrange
      mockRequest.body = {
        name: "Invalid Price Product",
        description: "Testing invalid price",
        price: "not-a-price", // Invalid type for price.
        stockQuantity: 10,
        category: "ValidationTest",
        imageUrl: "https://example.com/invalid-price.jpg",
      };
      // Act
      createProductHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseJsonPayload.message).toBe(
        "Fields price and stockQuantity must be numbers."
      );
      expect(products.length).toBe(0);
    });
  });

  // --- Tests for listProductsHandler ---
  describe("listProductsHandler", () => {
    // Define sample product data to be used in these tests.
    const sampleProductFull: Product = {
      id: uuid(),
      name: "Full Product",
      description: "Desc",
      detailedDescription: "Detailed info",
      price: 10,
      stockQuantity: 100,
      category: "Cat1",
      imageUrl: "https://example.com/full.jpg",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const sampleProductMandatoryOnly: Product = {
      id: uuid(),
      name: "Mandatory Only Product",
      description: "Desc Mand",
      price: 20,
      stockQuantity: 50,
      category: "Cat1",
      imageUrl: "https://example.com/mandatory.jpg",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Setup runs before each test in this suite.
    beforeEach(() => {
      products.length = 0;
      mockRequest = { query: {} };
      responseJsonPayload = {};
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((payload) => {
          responseJsonPayload = payload;
        }),
      };
    });
    // Teardown runs after each test to ensure a clean state for the next suite.
    afterEach(() => {
      products.length = 0;
    });

    // Test case: verifies the handler returns products with both mandatory and optional fields correctly.
    it("should return products including mandatory imageUrl and optional detailedDescription", () => {
      // Arrange: Add products with and without optional fields to the array.
      products.push(sampleProductFull, sampleProductMandatoryOnly);
      // Act
      listProductsHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseJsonPayload.data.length).toBe(2);
      const p1 = responseJsonPayload.data.find(
        (p: Product) => p.id === sampleProductFull.id
      );
      const p2 = responseJsonPayload.data.find(
        (p: Product) => p.id === sampleProductMandatoryOnly.id
      );

      expect(p1.imageUrl).toBe(sampleProductFull.imageUrl);
      expect(p1.detailedDescription).toBe(
        sampleProductFull.detailedDescription
      );
      expect(p2.imageUrl).toBe(sampleProductMandatoryOnly.imageUrl);
      expect(p2.detailedDescription).toBeUndefined();
    });

    // Test case: verifies that an empty array and correct pagination info are returned when there are no products.
    it("should return an empty list and correct pagination when no products exist", () => {
      // Arrange: products array is already empty from beforeEach.
      // Act
      listProductsHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseJsonPayload.data).toEqual([]); // Expect an empty data array.
      expect(responseJsonPayload.pagination.totalItems).toBe(0);
      expect(responseJsonPayload.pagination.totalPages).toBe(0);
    });
    // Note: Other pagination tests for listProductsHandler can be added here.
  });

  // --- Tests for getProductByIdHandler ---
  describe("getProductByIdHandler", () => {
    // Arrange: Create a sample product to be used for testing.
    const testProductWithImage: Product = {
      id: uuid(),
      name: "Specific Product",
      description: "Desc",
      detailedDescription: "Very specific details",
      price: 99,
      stockQuantity: 10,
      category: "TestCat",
      imageUrl: "https://example.com/specific.jpg",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      products.length = 0;
      products.push(testProductWithImage); // Add the test product to the in-memory array.
      mockRequest = { params: {} };
      responseJsonPayload = {};
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((payload) => {
          responseJsonPayload = payload;
        }),
      };
    });
    afterEach(() => {
      products.length = 0;
    });

    // Test case: verifies that a product is returned successfully when a valid ID is provided.
    it("should return 200 and the product (with imageUrl) if found", () => {
      // Arrange: Set the 'id' parameter in the mock request.
      mockRequest.params = { id: testProductWithImage.id };
      // Act
      getProductByIdHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      // Use .toEqual to compare the entire object.
      expect(responseJsonPayload).toEqual(testProductWithImage);
    });

    // Test case: verifies that a 404 Not Found is returned for a non-existent ID.
    it("should return 404 if product not found", () => {
      // Arrange
      const nonExistentId = uuid();
      mockRequest.params = { id: nonExistentId };
      // Act
      getProductByIdHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseJsonPayload.message).toBe(
        `Product with id '${nonExistentId}' not found.`
      );
    });
  });

  // --- Tests for updateProductHandler ---
  describe("updateProductHandler", () => {
    let initialProduct: Product;

    beforeEach(() => {
      products.length = 0;
      initialProduct = {
        id: uuid(),
        name: "Old Name",
        description: "Old Desc",
        detailedDescription: "Old Detailed Info",
        price: 50,
        stockQuantity: 50,
        category: "OldCat",
        imageUrl: "https://example.com/old.jpg",
        createdAt: new Date(Date.now() - 100000),
        updatedAt: new Date(Date.now() - 100000),
      };
      products.push(initialProduct);
      mockRequest = { params: {}, body: {} };
      responseJsonPayload = {};
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((payload) => {
          responseJsonPayload = payload;
        }),
      };
    });
    afterEach(() => {
      products.length = 0;
    });

    // Test case: verifies a successful update with a full payload.
    it("should update an existing product including mandatory imageUrl and return 200", () => {
      // Arrange
      mockRequest.params = { id: initialProduct.id };
      mockRequest.body = {
        name: "Updated Super Product",
        description: "Updated description",
        detailedDescription: "This is the new very detailed description.",
        price: 65.5,
        stockQuantity: 35,
        category: "Updated Electronics",
        imageUrl: "https://example.com/updated-super.jpg",
      };
      // Act
      updateProductHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseJsonPayload.id).toBe(initialProduct.id); // ID should not change.
      expect(responseJsonPayload.name).toBe(mockRequest.body.name);
      expect(responseJsonPayload.imageUrl).toBe(mockRequest.body.imageUrl);
      expect(responseJsonPayload.detailedDescription).toBe(
        mockRequest.body.detailedDescription
      );
      expect(new Date(responseJsonPayload.updatedAt).getTime()).toBeGreaterThan(
        initialProduct.updatedAt.getTime()
      ); // 'updatedAt' should be newer.
      const updatedProductInArray = products.find(
        (p) => p.id === initialProduct.id
      );
      expect(updatedProductInArray?.imageUrl).toBe(mockRequest.body.imageUrl);
    });

    // Test case: verifies that a 400 error is returned if the mandatory imageUrl is missing.
    it("should return 400 if mandatory imageUrl is missing in update request", () => {
      // Arrange
      mockRequest.params = { id: initialProduct.id };
      mockRequest.body = {
        // 'imageUrl' is missing from this update payload.
        name: "Update Without Image",
        description: "This update is missing the image URL",
        price: 70.0,
        stockQuantity: 25,
        category: "Testing Update",
      };
      // Act
      updateProductHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseJsonPayload.message).toBe(
        "Please provide all required fields for update: name, description, price, stockQuantity, category, imageUrl"
      );
    });
  });

  // --- Tests for deleteProductHandler ---
  describe("deleteProductHandler", () => {
    // Note: These tests are not directly affected by the new fields, as they deal with
    // the existence of the product, not its content. We just need to ensure the test
    // data object ('productToDelete') is valid according to the Product interface.
    let productToDelete: Product;
    beforeEach(() => {
      products.length = 0;
      productToDelete = {
        id: uuid(),
        name: "Product to Delete",
        description: "Desc",
        price: 10,
        stockQuantity: 1,
        category: "ToDelete",
        imageUrl: "https://example.com/to-delete.jpg", // Mandatory field added
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      products.push(productToDelete);
      mockRequest = { params: {} };
      responseJsonPayload = {};
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((payload) => {
          responseJsonPayload = payload;
        }),
        send: jest.fn().mockReturnThis(), // Mock 'send' for the 204 No Content response.
      };
    });
    afterEach(() => {
      products.length = 0;
    });

    // Test case: verifies a successful deletion.
    it("should delete an existing product and return 204 No Content", () => {
      // Arrange
      mockRequest.params = { id: productToDelete.id };
      const initialProductCount = products.length;
      // Act
      deleteProductHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalledTimes(1); // .send() should be called for 204.
      expect(mockResponse.json).not.toHaveBeenCalled(); // .json() should not be called.
      expect(products.length).toBe(initialProductCount - 1); // Verify removal from array.
      expect(products.find((p) => p.id === productToDelete.id)).toBeUndefined();
    });

    // Test case: verifies a 404 is returned if trying to delete a non-existent product.
    it("should return 404 if product to delete is not found", () => {
      // Arrange
      const nonExistentId = uuid();
      mockRequest.params = { id: nonExistentId };
      // Act
      deleteProductHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseJsonPayload.message).toBe(
        `Product with id '${nonExistentId}' not found, cannot delete.`
      );
      expect(products.length).toBe(1); // The array should be unchanged.
    });
  });
});
