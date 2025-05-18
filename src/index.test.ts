import { Request, Response } from "express";
import {
  createProductHandler,
  products,
  Product,
  listProductsHandler,
  getProductByIdHandler,
  updateProductHandler,
  deleteProductHandler,
} from ".";
import { v4 as uuid } from "uuid";

describe("Product API Handlers", () => {
  describe("createProductHandler", () => {
    let mockRequest: Partial<Request>; // Mocking the request object
    let mockResponse: Partial<Response>;
    let responseJsonPayLoad: any; // Variable to store the response payload

    beforeEach(() => {
      products.length = 0; // Clear the products array before each test

      // Mocking the response object
      mockRequest = {
        // Mocking the request object
        body: {},
      };

      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((payload) => {
          responseJsonPayLoad = payload; // Store the response payload
        }),
      };
    });

    it("should create a new product and return 201 status with the product data", () => {
      mockRequest.body = {
        name: "Awesome Gadget",
        description: "The next big thing!",
        price: 129.99,
        stockQuantity: 50,
        category: "Electronics",
      };

      createProductHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201); // Check if status 201 was set
      expect(mockResponse.json).toHaveBeenCalled(); // Check if json was called

      expect(responseJsonPayLoad.id).toBeDefined(); // Check if id is defined
      expect(responseJsonPayLoad.name).toBe(mockRequest.body.name);
      expect(responseJsonPayLoad.price).toBe(mockRequest.body.price);
      expect(responseJsonPayLoad.createdAt).toBeDefined();
      expect(responseJsonPayLoad.updatedAt).toBeDefined();

      expect(products.length).toBe(1); // Check if product was added to the array
      expect(products[0].name).toBe(mockRequest.body.name);
    });

    it("should return 400 status if required fields are missing", () => {
      mockRequest.body = {
        // Missing name files
        description: "The next big thing!",
        price: 129.99,
        stockQuantity: 50,
        category: "Electronics",
      };
      createProductHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledTimes(1);
      expect(responseJsonPayLoad.message).toBe(
        "Please provide all required fields: name, description, price, stockQuantity, category"
      );

      // Check if the products array is still empty
      expect(products.length).toBe(0);
    });

    it("should return 400 if price is not a number", () => {
      mockRequest.body = {
        name: "Invalid Price Product",
        description: "Testing invalid price",
        price: "not-a-price", // Geçersiz fiyat
        stockQuantity: 10,
        category: "ValidationTest",
      };

      createProductHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseJsonPayLoad.message).toBe(
        "Fields price and stockQuantity must be numbers."
      );
      expect(products.length).toBe(0);
    });
  });

  describe("listProductsHandler", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let responseJsonPayload: any;

    // Örnek ürünlerimizi testlerde kullanmak üzere oluşturalım
    const sampleProduct1: Product = {
      id: uuid(),
      name: "Product 1",
      description: "Desc 1",
      price: 10,
      stockQuantity: 100,
      category: "Cat1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const sampleProduct2: Product = {
      id: uuid(),
      name: "Product 2",
      description: "Desc 2",
      price: 20,
      stockQuantity: 50,
      category: "Cat1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const sampleProduct3: Product = {
      id: uuid(),
      name: "Product 3",
      description: "Desc 3",
      price: 30,
      stockQuantity: 20,
      category: "Cat2",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const sampleProduct4: Product = {
      id: uuid(),
      name: "Product 4",
      description: "Desc 4",
      price: 40,
      stockQuantity: 10,
      category: "Cat2",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const sampleProduct5: Product = {
      id: uuid(),
      name: "Product 5",
      description: "Desc 5",
      price: 50,
      stockQuantity: 5,
      category: "Cat1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      products.length = 0; // Her testten önce products dizisini temizle

      mockRequest = {
        query: {}, // query parametrelerini her testte ayrıca set edeceğiz
      };
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((payload) => {
          responseJsonPayload = payload;
        }),
      };
    });

    it("should return an empty list and correct pagination when no products exist", () => {
      // products dizisi zaten beforeEach'te boşaltıldı
      listProductsHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseJsonPayload.data).toEqual([]);
      expect(responseJsonPayload.pagination.totalItems).toBe(0);
      expect(responseJsonPayload.pagination.totalPages).toBe(0);
      expect(responseJsonPayload.pagination.currentPage).toBe(1); // Varsayılan sayfa 1
      expect(responseJsonPayload.pagination.limit).toBe(10); // Varsayılan limit 10
    });

    it("should return all products with default pagination when products exist", () => {
      products.push(sampleProduct1, sampleProduct2); // Diziye 2 ürün ekle

      listProductsHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseJsonPayload.data.length).toBe(2);
      expect(responseJsonPayload.data[0].name).toBe("Product 1");
      expect(responseJsonPayload.data[1].name).toBe("Product 2");
      expect(responseJsonPayload.pagination.totalItems).toBe(2);
      expect(responseJsonPayload.pagination.totalPages).toBe(1);
      expect(responseJsonPayload.pagination.currentPage).toBe(1);
    });

    it("should return paginated products correctly (e.g., page 2, limit 2)", () => {
      products.push(
        sampleProduct1,
        sampleProduct2,
        sampleProduct3,
        sampleProduct4,
        sampleProduct5
      ); // 5 ürün
      mockRequest.query = { page: "2", limit: "2" };

      listProductsHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseJsonPayload.data.length).toBe(2);
      expect(responseJsonPayload.data[0].name).toBe("Product 3"); // Sayfa 2, limit 2 => 3. ve 4. ürünler
      expect(responseJsonPayload.data[1].name).toBe("Product 4");
      expect(responseJsonPayload.pagination.currentPage).toBe(2);
      expect(responseJsonPayload.pagination.totalPages).toBe(3); // 5 ürün, limit 2 => 3 sayfa
      expect(responseJsonPayload.pagination.totalItems).toBe(5);
      expect(responseJsonPayload.pagination.limit).toBe(2);
    });

    it("should return 400 if page parameter is invalid", () => {
      mockRequest.query = { page: "invalid", limit: "2" };
      listProductsHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseJsonPayload.message).toBe(
        "Invalid pagination parameters. Page and limit must be positive numbers."
      );
    });

    it("should return 400 if limit parameter is invalid", () => {
      mockRequest.query = { page: "1", limit: "-5" }; // Negatif limit
      listProductsHandler(
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

  describe("getProductByIdHandler", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let responseJsonPayload: any;

    const testProduct: Product = {
      id: uuid(),
      name: "Test Product for GetByID",
      description: "A specific product",
      price: 99,
      stockQuantity: 10,
      category: "TestCategory",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      products.length = 0; // products dizisini temizle
      products.push(testProduct); // Test için bir ürün ekle

      mockRequest = {
        params: {}, // params'ı her testte ayrıca set edeceğiz
      };
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((payload) => {
          responseJsonPayload = payload;
        }),
      };
    });

    it("should return 200 and the product if found", () => {
      mockRequest.params = { id: testProduct.id };

      getProductByIdHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledTimes(1);
      expect(responseJsonPayload).toEqual(testProduct); // Dönen ürünün eklediğimiz ürünle aynı olmasını bekle
    });

    it("should return 404 if product not found", () => {
      const nonExistentId = uuid(); // Var olmayan bir ID
      mockRequest.params = { id: nonExistentId };

      getProductByIdHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledTimes(1);
      expect(responseJsonPayload.message).toBe(
        `Product with id '${nonExistentId}' not found.`
      );
    });
  });

  describe("updateProductHandler", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let responseJsonPayload: any;

    let initialProduct: Product; // Güncellenecek test ürünü

    beforeEach(() => {
      products.length = 0; // products dizisini temizle

      initialProduct = {
        id: uuid(),
        name: "Old Product Name",
        description: "Old Description",
        price: 50,
        stockQuantity: 50,
        category: "OldCategory",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 gün önce oluşturuldu
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // ve 2 gün önce güncellendi
      };
      products.push(initialProduct); // Test için bir ürün ekle

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

    it("should update an existing product and return 200 with updated data", () => {
      mockRequest.params = { id: initialProduct.id };
      mockRequest.body = {
        name: "New Product Name",
        description: "New Description",
        price: 60,
        stockQuantity: 40,
        category: "NewCategory",
      };

      updateProductHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseJsonPayload.id).toBe(initialProduct.id);
      expect(responseJsonPayload.name).toBe(mockRequest.body.name);
      expect(responseJsonPayload.description).toBe(
        mockRequest.body.description
      );
      expect(responseJsonPayload.price).toBe(mockRequest.body.price);
      expect(responseJsonPayload.stockQuantity).toBe(
        mockRequest.body.stockQuantity
      );
      expect(responseJsonPayload.category).toBe(mockRequest.body.category);
      expect(responseJsonPayload.createdAt).toEqual(initialProduct.createdAt); // Oluşturma tarihi değişmemeli
      expect(new Date(responseJsonPayload.updatedAt)).toBeInstanceOf(Date);
      expect(new Date(responseJsonPayload.updatedAt).getTime()).toBeGreaterThan(
        initialProduct.updatedAt.getTime()
      ); // Güncelleme tarihi ilerlemiş olmalı

      // products dizisindeki ürünün de güncellendiğini kontrol et
      const updatedProductInArray = products.find(
        (p) => p.id === initialProduct.id
      );
      expect(updatedProductInArray?.name).toBe(mockRequest.body.name);
    });

    it("should return 404 if product to update is not found", () => {
      const nonExistentId = uuid();
      mockRequest.params = { id: nonExistentId };
      mockRequest.body = {
        name: "Any Name",
        description: "Any Desc",
        price: 10,
        stockQuantity: 10,
        category: "AnyCat",
      };

      updateProductHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseJsonPayload.message).toBe(
        `Product with id '${nonExistentId}' not found, cannot update.`
      );
    });

    it("should return 400 if required fields are missing in update request", () => {
      mockRequest.params = { id: initialProduct.id };
      mockRequest.body = {
        // name alanı eksik
        description: "New Description Only",
        price: 65,
        stockQuantity: 35,
        category: "NewCategoryMissingName",
      };

      updateProductHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseJsonPayload.message).toBe(
        "Please provide all required fields for update: name, description, price, stockQuantity, category"
      );
    });

    it("should return 400 if price is not a number in update request", () => {
      mockRequest.params = { id: initialProduct.id };
      mockRequest.body = {
        name: "Updated Name",
        description: "Updated Description",
        price: "not-a-valid-price", // geçersiz fiyat
        stockQuantity: 30,
        category: "UpdatedCategory",
      };

      updateProductHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseJsonPayload.message).toBe(
        "Fields price and stockQuantity must be numbers."
      );
    });
  });

  describe("deleteProductHandler", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let responseJsonPayload: any; // Sadece 404 durumunda json payload'ı yakalamak için

    let productToDelete: Product;

    beforeEach(() => {
      products.length = 0; // products dizisini temizle

      productToDelete = {
        id: uuid(),
        name: "Product to Delete",
        description: "This will be deleted",
        price: 10,
        stockQuantity: 1,
        category: "ToDelete",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      products.push(productToDelete); // Test için silinecek bir ürün ekle

      mockRequest = {
        params: {},
      };

      responseJsonPayload = {}; // Reset payload catcher
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((payload) => {
          // 404 için json payload'ını yakala
          responseJsonPayload = payload;
        }),
        send: jest.fn().mockReturnThis(), // 204 No Content için .send() çağrısını yakala
      };
    });

    it("should delete an existing product and return 204 No Content", () => {
      mockRequest.params = { id: productToDelete.id };
      const initialProductCount = products.length;

      deleteProductHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalledTimes(1); // .send() çağrılmış olmalı
      expect(mockResponse.json).not.toHaveBeenCalled(); // .json() çağrılmamış olmalı

      // Ürünün diziden silindiğini kontrol et
      expect(products.length).toBe(initialProductCount - 1);
      const deletedProductInArray = products.find(
        (p) => p.id === productToDelete.id
      );
      expect(deletedProductInArray).toBeUndefined();
    });

    it("should return 404 if product to delete is not found", () => {
      const nonExistentId = uuid();
      mockRequest.params = { id: nonExistentId };

      deleteProductHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledTimes(1);
      expect(responseJsonPayload.message).toBe(
        `Product with id '${nonExistentId}' not found, cannot delete.`
      );
      expect(products.length).toBe(1); // Dizideki ürün sayısı değişmemeli
    });
  });
});
