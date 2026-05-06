import request from "supertest";
import express from "express";
import searchRoutes from "../routes/search.routes.js";
import axios from "axios";
import searchDAO from "../daos/search.dao.js";
import { llmProducts } from "./data/products.llm.js";

// ─────────────────────────────
// MOCK EXTERNO (solo axios)
// ─────────────────────────────
jest.mock("axios");

// ─────────────────────────────
// MOCK ELASTIC (DAO REAL CONTROLADO)
// ─────────────────────────────
jest.mock("../daos/search.dao.js", () => ({
  createIndex: jest.fn(),
  deleteIndex: jest.fn(),
  indexProduct: jest.fn(),
  searchProducts: jest.fn(),
  searchByCategory: jest.fn()
}));

const app = express();
app.use(express.json());
app.use("/", searchRoutes);

describe("Search Service - Integration PRO", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────
  // 1. REINDEX (flujo completo real)
  // ─────────────────────────────
  it("POST /reindex debe eliminar, crear e indexar productos (LLM mock)", async () => {

    axios.get.mockResolvedValue({
      data: llmProducts
    });

    searchDAO.indexProduct.mockResolvedValue(true);

    const res = await request(app).post("/reindex");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Reindexación completa" });

    // 🔥 valida flujo interno completo
    expect(searchDAO.deleteIndex).toHaveBeenCalled();
    expect(searchDAO.createIndex).toHaveBeenCalled();
    expect(axios.get).toHaveBeenCalled();

    // 🔥 valida que se indexaron todos los productos LLM
    expect(searchDAO.indexProduct).toHaveBeenCalledTimes(llmProducts.length);
  });

  // ─────────────────────────────
  // 2. SEARCH PRODUCTS (flujo real)
  // ─────────────────────────────
  it("GET /products?q debe buscar productos correctamente", async () => {

    const fakeResults = [
      {
        name: "Pizza Pepperoni",
        description: "Pizza con queso mozzarella",
        category: "Italiana"
      }
    ];

    searchDAO.searchProducts.mockResolvedValue(fakeResults);

    const res = await request(app)
      .get("/products")
      .query({ q: "pizza" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeResults);

    // valida que realmente pasó al DAO
    expect(searchDAO.searchProducts).toHaveBeenCalledWith("pizza");
  });

  // ─────────────────────────────
  // 3. SEARCH BY CATEGORY (flujo real)
  // ─────────────────────────────
  it("GET /products/category/:categoria debe filtrar correctamente", async () => {

    const fakeResults = [
      {
        name: "Sushi Roll California",
        category: "Japonesa"
      }
    ];

    searchDAO.searchByCategory.mockResolvedValue(fakeResults);

    const res = await request(app)
      .get("/products/category/Japonesa");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeResults);

    expect(searchDAO.searchByCategory).toHaveBeenCalledWith("Japonesa");
  });

  // ─────────────────────────────
  // 4. VALIDACIONES (casos negativos)
  // ─────────────────────────────

  it("GET /products sin query debe retornar 400", async () => {

    const res = await request(app).get("/products");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Query 'q' es requerida"
    });
  });

});