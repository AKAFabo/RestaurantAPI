import {
  reindex,
  searchProducts,
  searchByCategory
} from "../controller/search.controller.js";

import searchService from "../services/search.service.js";

// ─────────────────────────────
// MOCK del service
// ─────────────────────────────
jest.mock("../services/search.service.js", () => ({
  reindex: jest.fn(),
  searchProducts: jest.fn(),
  searchByCategory: jest.fn(),
}));

// helper para mockear res
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("SearchController", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────
  // reindex
  // ─────────────────────────────
  describe("reindex", () => {

    it("debe responder con éxito", async () => {

      const req = {};
      const res = mockResponse();

      searchService.reindex.mockResolvedValue({
        message: "Reindexación completa"
      });

      await reindex(req, res);

      expect(searchService.reindex).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "Reindexación completa"
      });
    });

    it("debe manejar error", async () => {

      const req = {};
      const res = mockResponse();

      searchService.reindex.mockRejectedValue(new Error("fail"));

      await reindex(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Error reindexando"
      });
    });

  });

  // ─────────────────────────────
  // searchProducts
  // ─────────────────────────────
  describe("searchProducts", () => {

    it("debe buscar productos correctamente", async () => {

      const req = { query: { q: "pizza" } };
      const res = mockResponse();

      const fakeResults = [{ name: "Pizza" }];

      searchService.searchProducts.mockResolvedValue(fakeResults);

      await searchProducts(req, res);

      expect(searchService.searchProducts).toHaveBeenCalledWith("pizza");
      expect(res.json).toHaveBeenCalledWith(fakeResults);
    });

    it("debe retornar 400 si no hay query", async () => {

      const req = { query: {} };
      const res = mockResponse();

      await searchProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Query 'q' es requerida"
      });
    });

    it("debe manejar error del service", async () => {

      const req = { query: { q: "pizza" } };
      const res = mockResponse();

      searchService.searchProducts.mockRejectedValue(new Error("fail"));

      await searchProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Error buscando productos"
      });
    });

  });

  // ─────────────────────────────
  // searchByCategory
  // ─────────────────────────────
  describe("searchByCategory", () => {

    it("debe buscar por categoría correctamente", async () => {

      const req = { params: { categoria: "Bebidas" } };
      const res = mockResponse();

      const fakeResults = [{ name: "Refresco" }];

      searchService.searchByCategory.mockResolvedValue(fakeResults);

      await searchByCategory(req, res);

      expect(searchService.searchByCategory).toHaveBeenCalledWith("Bebidas");
      expect(res.json).toHaveBeenCalledWith(fakeResults);
    });

    it("debe manejar error", async () => {

      const req = { params: { categoria: "Bebidas" } };
      const res = mockResponse();

      searchService.searchByCategory.mockRejectedValue(new Error("fail"));

      await searchByCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Error buscando por categoría"
      });
    });

  });

});