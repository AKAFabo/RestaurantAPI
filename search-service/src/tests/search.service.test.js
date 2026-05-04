import axios from "axios";
import SearchService from "../services/search.service.js";
import searchDAO from "../daos/search.dao.js";

// ─────────────────────────────
// MOCKS
// ─────────────────────────────
jest.mock("axios");

jest.mock("../daos/search.dao.js", () => ({
  deleteIndex: jest.fn(),
  createIndex: jest.fn(),
  indexProduct: jest.fn(),
  searchProducts: jest.fn(),
  searchByCategory: jest.fn(),
}));

describe("SearchService", () => {

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.API_URL = "http://fake-api.com";
  });

  // ─────────────────────────────
  // reindex
  // ─────────────────────────────
  it("debe reindexar productos correctamente", async () => {

    const fakeProducts = [
      {
        name: "Pizza",
        description: "Pizza italiana",
        category: "Comida"
      },
      {
        name: "Refresco",
        description: null,
        category: "Bebidas"
      }
    ];

    axios.get.mockResolvedValue({ data: fakeProducts });

    const result = await SearchService.reindex();

    expect(searchDAO.deleteIndex).toHaveBeenCalled();
    expect(searchDAO.createIndex).toHaveBeenCalled();

    expect(axios.get).toHaveBeenCalledWith("http://fake-api.com/products");

    expect(searchDAO.indexProduct).toHaveBeenCalledTimes(2);

    // producto normal
    expect(searchDAO.indexProduct).toHaveBeenCalledWith({
      name: "Pizza",
      description: "Pizza italiana",
      category: "Comida"
    });

    // producto sin descripción
    expect(searchDAO.indexProduct).toHaveBeenCalledWith({
      name: "Refresco",
      description: "Producto sin descripción",
      category: "Bebidas"
    });

    expect(result).toEqual({ message: "Reindexación completa" });
  });

  // ─────────────────────────────
  // reindex - error en API
  // ─────────────────────────────
  it("debe lanzar error si falla la API", async () => {

    axios.get.mockRejectedValue(new Error("API error"));

    await expect(SearchService.reindex()).rejects.toThrow("API error");
  });

  // ─────────────────────────────
  // searchProducts
  // ─────────────────────────────
  it("debe buscar productos por texto", async () => {

    const fakeResult = [{ name: "Pizza" }];

    searchDAO.searchProducts.mockResolvedValue(fakeResult);

    const result = await SearchService.searchProducts("pizza");

    expect(searchDAO.searchProducts).toHaveBeenCalledWith("pizza");
    expect(result).toEqual(fakeResult);
  });

  // ─────────────────────────────
  // searchByCategory
  // ─────────────────────────────
  it("debe buscar productos por categoría", async () => {

    const fakeResult = [{ name: "Refresco", category: "Bebidas" }];

    searchDAO.searchByCategory.mockResolvedValue(fakeResult);

    const result = await SearchService.searchByCategory("Bebidas");

    expect(searchDAO.searchByCategory).toHaveBeenCalledWith("Bebidas");
    expect(result).toEqual(fakeResult);
  });

});