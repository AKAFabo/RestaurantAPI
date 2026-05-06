
// Mockea el pool de conexión para no depender de una base de datos real

import PostgresMenuDAO from "../daos/menu/menu.postgres.Dao.js";
import { pool } from "../config/database.js";

// Mock del pool de PostgreSQL - intercepta todas las queries
jest.mock("../config/database.js", () => ({
  pool: {
    query: jest.fn()
  }
}));


// PRUEBAS: getMenuById

describe("PostgresMenuDAO - getMenuById", () => {

  beforeEach(() => {
    jest.clearAllMocks(); // limpia llamadas entre pruebas
  });

  // Caso exitoso: el menú existe y tiene productos
  it("debe devolver el menú con sus productos cuando existe", async () => {

    const fakeMenu = {
      id: 1,
      restaurant_id: 1,
      name: "Menú del día",
      created_at: "2026-01-01"
    };

    const fakeProducts = [
      { id: 1, name: "Tacos de Canasta", description: "Rellenos de frijol", price: 4.50, available: true, category: "Antojitos" },
      { id: 2, name: "Agua de Jamaica", description: "Bebida fría natural", price: 2.00, available: true, category: "Bebidas" }
    ];

    // Primera query trae el menú, segunda trae los productos
    pool.query
      .mockResolvedValueOnce({ rows: [fakeMenu] })
      .mockResolvedValueOnce({ rows: fakeProducts });

    const result = await PostgresMenuDAO.getMenuById(1);

    // Verifica que se hicieron exactamente 2 queries (menú + productos)
    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ ...fakeMenu, products: fakeProducts });
  });

  // Caso: el menú existe pero no tiene productos
  it("debe devolver el menú con lista vacía si no tiene productos", async () => {

    const fakeMenu = {
      id: 1,
      restaurant_id: 1,
      name: "Menú vacío",
      created_at: "2026-01-01"
    };

    pool.query
      .mockResolvedValueOnce({ rows: [fakeMenu] })
      .mockResolvedValueOnce({ rows: [] }); // sin productos

    const result = await PostgresMenuDAO.getMenuById(1);

    expect(result).toEqual({ ...fakeMenu, products: [] });
  });

  // Caso: el menú no existe
  it("debe devolver null si el menú no existe", async () => {

    pool.query.mockResolvedValueOnce({ rows: [] });

    const result = await PostgresMenuDAO.getMenuById(99);

    // Solo debe hacer 1 query, no busca productos si no hay menú
    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(result).toBeNull();
  });

  // Caso: error en la base de datos
  it("debe propagar el error si falla la query", async () => {

    pool.query.mockRejectedValue(new Error("DB error"));

    await expect(PostgresMenuDAO.getMenuById(1)).rejects.toThrow("DB error");
  });

});


// PRUEBAS: updateMenuById

describe("PostgresMenuDAO - updateMenuById", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Caso exitoso: actualización correcta
  it("debe actualizar y retornar el menú actualizado", async () => {

    const fakeMenu = {
      id: 1,
      restaurant_id: 1,
      name: "Nuevo nombre",
      created_at: "2026-01-01"
    };

    pool.query.mockResolvedValue({ rows: [fakeMenu] });

    const result = await PostgresMenuDAO.updateMenuById(1, "Nuevo nombre");

    // Verifica que la query contiene UPDATE menus y los valores correctos
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE menus"),
      ["Nuevo nombre", 1]
    );
    expect(result).toEqual(fakeMenu);
  });

  // Caso: el menú no existe
  it("debe devolver null si el menú no existe", async () => {

    pool.query.mockResolvedValue({ rows: [] });

    const result = await PostgresMenuDAO.updateMenuById(99, "Test");

    expect(result).toBeNull();
  });

  // Caso: error en la base de datos
  it("debe propagar el error si falla la query", async () => {

    pool.query.mockRejectedValue(new Error("DB error"));

    await expect(PostgresMenuDAO.updateMenuById(1, "Test")).rejects.toThrow("DB error");
  });

});


// PRUEBAS: deleteMenu

describe("PostgresMenuDAO - deleteMenu", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Caso exitoso: elimina correctamente
  // Primero elimina order_items relacionados, luego el menú
  it("debe eliminar el menú y retornarlo", async () => {

    const fakeMenu = { id: 1, name: "Menú eliminado" };

    pool.query
      .mockResolvedValueOnce({ rows: [] })        // DELETE order_items
      .mockResolvedValueOnce({ rows: [fakeMenu] }); // DELETE menus

    const result = await PostgresMenuDAO.deleteMenu(1);

    // Verifica que se hicieron exactamente 2 queries
    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(result).toEqual(fakeMenu);
  });

  // Caso: el menú no existe
  it("debe devolver null si el menú no existe", async () => {

    pool.query
      .mockResolvedValueOnce({ rows: [] }) // DELETE order_items
      .mockResolvedValueOnce({ rows: [] }); // DELETE menus sin resultado

    const result = await PostgresMenuDAO.deleteMenu(99);

    expect(result).toBeNull();
  });

  // Caso: error en la base de datos
  it("debe propagar el error si falla la query", async () => {

    pool.query.mockRejectedValue(new Error("DB error"));

    await expect(PostgresMenuDAO.deleteMenu(1)).rejects.toThrow("DB error");
  });

});


// PRUEBAS: getAllProducts

describe("PostgresMenuDAO - getAllProducts", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Caso exitoso: retorna todos los productos
  it("debe retornar todos los productos", async () => {

    const fakeProducts = [
      { id: 1, name: "Tacos de Canasta", description: "Rellenos de frijol", category: "Antojitos", price: 4.50 },
      { id: 2, name: "Agua de Jamaica", description: "Bebida fría natural", category: "Bebidas", price: 2.00 },
      { id: 3, name: "Enchiladas Verdes", description: "Con pollo y salsa verde", category: "Platos fuertes", price: 8.00 }
    ];

    pool.query.mockResolvedValue({ rows: fakeProducts });

    const result = await PostgresMenuDAO.getAllProducts();

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("SELECT")
    );
    expect(result).toEqual(fakeProducts);
  });

  // Caso: no hay productos en la base de datos
  it("debe retornar lista vacía si no hay productos", async () => {

    pool.query.mockResolvedValue({ rows: [] });

    const result = await PostgresMenuDAO.getAllProducts();

    expect(result).toEqual([]);
  });

  // Caso: error en la base de datos
  it("debe propagar el error si falla la query", async () => {

    pool.query.mockRejectedValue(new Error("DB error"));

    await expect(PostgresMenuDAO.getAllProducts()).rejects.toThrow("DB error");
  });

});