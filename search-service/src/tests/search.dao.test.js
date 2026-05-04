import SearchDAO from "../daos/search.dao.js";
import { elasticClient } from "../config/elastic.js";

// ─────────────────────────────
// MOCK de elasticClient
// ─────────────────────────────
jest.mock("../config/elastic.js", () => ({
  elasticClient: {
    indices: {
      exists: jest.fn(),
      create: jest.fn(),
      delete: jest.fn()
    },
    index: jest.fn(),
    search: jest.fn()
  }
}));

describe("SearchDAO", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────
  // createIndex
  // ─────────────────────────────
  describe("createIndex", () => {

    it("debe crear el índice si no existe", async () => {

      elasticClient.indices.exists.mockResolvedValue(false);

      await SearchDAO.createIndex();

      expect(elasticClient.indices.exists).toHaveBeenCalledWith({ index: "products" });

      expect(elasticClient.indices.create).toHaveBeenCalledWith({
        index: "products",
        body: {
          mappings: {
            properties: {
              name: { type: "text" },
              category: { type: "keyword" },
              description: { type: "text" }
            }
          }
        }
      });
    });

    it("no debe crear el índice si ya existe", async () => {

      elasticClient.indices.exists.mockResolvedValue(true);

      await SearchDAO.createIndex();

      expect(elasticClient.indices.create).not.toHaveBeenCalled();
    });

  });

  // ─────────────────────────────
  // deleteIndex
  // ─────────────────────────────
  describe("deleteIndex", () => {

    it("debe eliminar el índice si existe", async () => {

      elasticClient.indices.exists.mockResolvedValue(true);

      await SearchDAO.deleteIndex();

      expect(elasticClient.indices.delete).toHaveBeenCalledWith({
        index: "products"
      });
    });

    it("no debe eliminar si no existe", async () => {

      elasticClient.indices.exists.mockResolvedValue(false);

      await SearchDAO.deleteIndex();

      expect(elasticClient.indices.delete).not.toHaveBeenCalled();
    });

  });

  // ─────────────────────────────
  // indexProduct
  // ─────────────────────────────
  describe("indexProduct", () => {

    it("debe indexar un producto", async () => {

      const product = {
        name: "Pizza",
        description: "Italiana",
        category: "Comida"
      };

      await SearchDAO.indexProduct(product);

      expect(elasticClient.index).toHaveBeenCalledWith({
        index: "products",
        document: product
      });
    });

  });

  // ─────────────────────────────
  // searchProducts
  // ─────────────────────────────
  describe("searchProducts", () => {

    it("debe buscar productos y mapear resultados", async () => {

      const fakeResponse = {
        hits: {
          hits: [
            { _source: { name: "Pizza" } },
            { _source: { name: "Hamburguesa" } }
          ]
        }
      };

      elasticClient.search.mockResolvedValue(fakeResponse);

      const result = await SearchDAO.searchProducts("pizza");

      expect(elasticClient.search).toHaveBeenCalledWith({
        index: "products",
        query: {
          multi_match: {
            query: "pizza",
            fields: ["name", "description"],
            fuzziness: "AUTO"
          }
        }
      });

      expect(result).toEqual([
        { name: "Pizza" },
        { name: "Hamburguesa" }
      ]);
    });

  });

  // ─────────────────────────────
  // searchByCategory
  // ─────────────────────────────
  describe("searchByCategory", () => {

    it("debe buscar por categoría y mapear resultados", async () => {

      const fakeResponse = {
        hits: {
          hits: [
            { _source: { name: "Refresco", category: "Bebidas" } }
          ]
        }
      };

      elasticClient.search.mockResolvedValue(fakeResponse);

      const result = await SearchDAO.searchByCategory("Bebidas");

      expect(elasticClient.search).toHaveBeenCalledWith({
        index: "products",
        query: {
          match: {
            category: "Bebidas"
          }
        }
      });

      expect(result).toEqual([
        { name: "Refresco", category: "Bebidas" }
      ]);
    });

  });

});