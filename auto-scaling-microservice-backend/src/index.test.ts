import { Request, Response } from "express";
import {
  createProductHandler,
  products, // products dizisini testler için import ediyoruz
  Product, // Product arayüzünü import ediyoruz
  listProductsHandler,
  getProductByIdHandler,
  updateProductHandler,
  deleteProductHandler,
} from "./index"; // index.ts'ten export edilenleri alıyoruz
import { v4 as uuid } from "uuid"; // ID üretimi için

describe("Product API Handlers", () => {
  // beforeEach içinde kullanılacak ortak mock nesneleri
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJsonPayload: any; // res.json() ile gönderilen payload'ı yakalamak için

  // --- createProductHandler Testleri ---
  describe("createProductHandler", () => {
    beforeEach(() => {
      products.length = 0; // Her testten önce products dizisini sıfırla
      mockRequest = { body: {} };
      responseJsonPayload = {}; // Payload yakalayıcıyı sıfırla
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((payload) => {
          responseJsonPayload = payload;
        }),
      };
    });

    it("should create a new product with all fields (including mandatory imageUrl) and return 201", () => {
      mockRequest.body = {
        name: "Super Laptop Pro",
        description: "Top-tier laptop for professionals",
        detailedDescription:
          "This laptop features an M3 Max chip and 32GB RAM.", // İsteğe bağlı
        price: 2499.99,
        stockQuantity: 15,
        category: "Electronics",
        imageUrl: "https://example.com/super-laptop-pro.jpg", // Zorunlu
      };

      createProductHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(responseJsonPayload.id).toBeDefined();
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

      expect(products.length).toBe(1);
      expect(products[0].name).toBe(mockRequest.body.name);
      expect(products[0].imageUrl).toBe(mockRequest.body.imageUrl);
    });

    it("should create a product if optional detailedDescription is missing but mandatory imageUrl is present, and return 201", () => {
      mockRequest.body = {
        name: "Standard Laptop",
        description: "Reliable laptop for daily use",
        // detailedDescription gönderilmiyor
        price: 799.99,
        stockQuantity: 30,
        category: "Electronics",
        imageUrl: "https://example.com/standard-laptop.jpg", // Zorunlu
      };

      createProductHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(responseJsonPayload.name).toBe(mockRequest.body.name);
      expect(responseJsonPayload.imageUrl).toBe(mockRequest.body.imageUrl);
      expect(responseJsonPayload.detailedDescription).toBeUndefined();
      expect(products.length).toBe(1);
      expect(products[0].detailedDescription).toBeUndefined();
    });

    it("should return 400 if mandatory imageUrl is missing", () => {
      mockRequest.body = {
        name: "Product Without Image",
        description: "This product is missing its image URL",
        price: 50.0,
        stockQuantity: 5,
        category: "Testing",
        // imageUrl eksik
      };
      createProductHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      // Hata mesajınızın güncellenmiş halini buraya yazın (imageUrl'ı içermeli)
      expect(responseJsonPayload.message).toBe(
        "Please provide all required fields: name, description, price, stockQuantity, category, imageUrl"
      );
      expect(products.length).toBe(0);
    });

    it("should return 400 if other required fields (e.g., name) are missing", () => {
      mockRequest.body = {
        // name eksik
        description: "A product without a name",
        price: 9.99,
        stockQuantity: 10,
        category: "Incomplete",
        imageUrl: "https://example.com/incomplete.jpg",
      };
      createProductHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseJsonPayload.message).toBe(
        "Please provide all required fields: name, description, price, stockQuantity, category, imageUrl"
      );
      expect(products.length).toBe(0);
    });

    it("should return 400 if price is not a number", () => {
      mockRequest.body = {
        name: "Invalid Price Product",
        description: "Testing invalid price",
        price: "not-a-price",
        stockQuantity: 10,
        category: "ValidationTest",
        imageUrl: "https://example.com/invalid-price.jpg",
      };
      createProductHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseJsonPayload.message).toBe(
        "Fields price and stockQuantity must be numbers."
      );
      expect(products.length).toBe(0);
    });
  });

  // --- listProductsHandler Testleri ---
  describe("listProductsHandler", () => {
    // Örnek ürünler (imageUrl zorunlu, detailedDescription isteğe bağlı)
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
      /* detailedDescription yok */ createdAt: new Date(),
      updatedAt: new Date(),
    };

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
    afterEach(() => {
      products.length = 0;
    });

    it("should return products including mandatory imageUrl and optional detailedDescription", () => {
      products.push(sampleProductFull, sampleProductMandatoryOnly);
      listProductsHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

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
    // ... (Diğer listProductsHandler testleri (boş liste, sayfalama, geçersiz parametreler) büyük ölçüde aynı kalabilir,
    // sadece `products.push` ile eklediğiniz örnek ürünlerin yeni Product arayüzüne uygun olduğundan emin olun.)
    it("should return an empty list and correct pagination when no products exist", () => {
      listProductsHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseJsonPayload.data).toEqual([]);
      expect(responseJsonPayload.pagination.totalItems).toBe(0);
      expect(responseJsonPayload.pagination.totalPages).toBe(0);
    });
  });

  // --- getProductByIdHandler Testleri ---
  describe("getProductByIdHandler", () => {
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
      products.push(testProductWithImage);
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

    it("should return 200 and the product (with imageUrl) if found", () => {
      mockRequest.params = { id: testProductWithImage.id };
      getProductByIdHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseJsonPayload).toEqual(testProductWithImage);
    });

    it("should return 404 if product not found", () => {
      const nonExistentId = uuid();
      mockRequest.params = { id: nonExistentId };
      getProductByIdHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseJsonPayload.message).toBe(
        `Product with id '${nonExistentId}' not found.`
      );
    });
  });

  // --- updateProductHandler Testleri ---
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

    it("should update an existing product including mandatory imageUrl and return 200", () => {
      mockRequest.params = { id: initialProduct.id };
      mockRequest.body = {
        name: "Updated Super Product",
        description: "Updated description",
        detailedDescription: "This is the new very detailed description.",
        price: 65.5,
        stockQuantity: 35,
        category: "Updated Electronics",
        imageUrl: "https://example.com/updated-super.jpg", // Zorunlu
      };
      updateProductHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseJsonPayload.id).toBe(initialProduct.id);
      expect(responseJsonPayload.name).toBe(mockRequest.body.name);
      expect(responseJsonPayload.imageUrl).toBe(mockRequest.body.imageUrl);
      expect(responseJsonPayload.detailedDescription).toBe(
        mockRequest.body.detailedDescription
      );
      expect(new Date(responseJsonPayload.updatedAt).getTime()).toBeGreaterThan(
        initialProduct.updatedAt.getTime()
      );
      const updatedProductInArray = products.find(
        (p) => p.id === initialProduct.id
      );
      expect(updatedProductInArray?.imageUrl).toBe(mockRequest.body.imageUrl);
    });

    it("should return 400 if mandatory imageUrl is missing in update request", () => {
      mockRequest.params = { id: initialProduct.id };
      mockRequest.body = {
        name: "Update Without Image",
        description: "This update is missing the image URL",
        price: 70.0,
        stockQuantity: 25,
        category: "Testing Update",
        // imageUrl eksik
      };
      updateProductHandler(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      // Hata mesajınızın güncellenmiş halini buraya yazın (imageUrl'ı içermeli)
      expect(responseJsonPayload.message).toBe(
        "Please provide all required fields for update: name, description, price, stockQuantity, category, imageUrl"
      );
    });
    // ... (updateProductHandler için diğer 404 ve 400 (diğer zorunlu alanlar için) testleri benzer şekilde kalabilir,
    // sadece mockRequest.body'lerinin imageUrl içerdiğinden emin olun eğer valid bir istek simüle ediliyorsa.)
  });

  // --- deleteProductHandler Testleri (Değişiklik Gerekmiyor) ---
  describe("deleteProductHandler", () => {
    // Bu testler ürünün içeriğiyle değil varlığıyla ilgilendiği için
    // imageUrl'ın zorunlu olması bu testleri doğrudan etkilemez.
    // Sadece beforeEach'te oluşturulan productToDelete'in Product arayüzüne
    // (yani zorunlu imageUrl alanına) sahip olduğundan emin olun.
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
        imageUrl: "https://example.com/to-delete.jpg", // Zorunlu alan eklendi
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      products.push(productToDelete);
      mockRequest = { params: {} };
      responseJsonPayload = {}; // Reset payload catcher
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((payload) => {
          responseJsonPayload = payload;
        }),
        send: jest.fn().mockReturnThis(),
      };
    });
    afterEach(() => {
      products.length = 0;
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
      expect(mockResponse.send).toHaveBeenCalledTimes(1);
      expect(products.length).toBe(initialProductCount - 1);
      expect(products.find((p) => p.id === productToDelete.id)).toBeUndefined();
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
      expect(responseJsonPayload.message).toBe(
        `Product with id '${nonExistentId}' not found, cannot delete.`
      );
      expect(products.length).toBe(1);
    });
  });
});
