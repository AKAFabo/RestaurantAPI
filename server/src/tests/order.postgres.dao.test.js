// order.postgres.dao.test.js
// Pruebas unitarias del DAO de órdenes para PostgreSQL
// Mockea el pool y el cliente de transacción para no depender de BD real

import PostgresOrderDAO from "../daos/orders/order.postgres.dao.js";
import { pool } from "../config/database.js";

// Mock del pool - necesitamos mockear tanto pool.query como pool.connect
jest.mock("../config/database.js", () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn()
  }
}));

// ─────────────────────────────────────────────
// HELPER: crea un cliente de transacción falso
// Se usa en create() que necesita BEGIN/COMMIT/ROLLBACK
// ─────────────────────────────────────────────
const createMockClient = () => ({
  query: jest.fn(),
  release: jest.fn()
});

// ─────────────────────────────────────────────
// PRUEBAS: create
// ─────────────────────────────────────────────
describe("PostgresOrderDAO - create", () => {

  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = createMockClient();
    // pool.connect devuelve el cliente de transacción falso
    pool.connect.mockResolvedValue(mockClient);
  });

  // Caso exitoso: orden creada correctamente con todos los items válidos
  it("debe crear una orden correctamente y hacer COMMIT", async () => {

    const fakeProduct = {
      id: 1,
      price: 4.50,
      available: true,
      restaurant_id: 5
    };

    const fakeOrder = {
      id: 10,
      user_id: 1,
      restaurant_id: 5,
      reservation_id: 2,
      status: "PENDING",
      total: 9.00
    };

    mockClient.query
      .mockResolvedValueOnce(null)                          // BEGIN
      .mockResolvedValueOnce({ rows: [fakeProduct] })       // SELECT producto
      .mockResolvedValueOnce({ rows: [fakeOrder] })         // INSERT order
      .mockResolvedValueOnce(null)                          // INSERT order_item
      .mockResolvedValueOnce(null);                         // COMMIT

    const result = await PostgresOrderDAO.create({
      user_id: 1,
      restaurant_id: 5,
      reservation_id: 2,
      items: [{ product_id: 1, quantity: 2 }]
    });

    // Verifica que la transacción se completó correctamente
    expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
    expect(mockClient.release).toHaveBeenCalled();
    expect(result).toEqual(fakeOrder);
  });

  // Caso: items vacío lanza error y hace ROLLBACK
  it("debe lanzar error y hacer ROLLBACK si items está vacío", async () => {

    mockClient.query.mockResolvedValueOnce(null); // BEGIN

    await expect(PostgresOrderDAO.create({
      user_id: 1,
      restaurant_id: 5,
      reservation_id: 2,
      items: [] // lista vacía
    })).rejects.toThrow("Items inválidos");

    // Verifica que hizo ROLLBACK y liberó el cliente
    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    expect(mockClient.release).toHaveBeenCalled();
  });

  // Caso: cantidad inválida en un item
  it("debe lanzar error si la cantidad de un item es inválida", async () => {

    mockClient.query.mockResolvedValueOnce(null); // BEGIN

    await expect(PostgresOrderDAO.create({
      user_id: 1,
      restaurant_id: 5,
      reservation_id: 2,
      items: [{ product_id: 1, quantity: 0 }] // cantidad inválida
    })).rejects.toThrow("Cantidad inválida para producto 1");

    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    expect(mockClient.release).toHaveBeenCalled();
  });

  // Caso: producto no existe en la base de datos
  it("debe lanzar error si el producto no existe", async () => {

    mockClient.query
      .mockResolvedValueOnce(null)              // BEGIN
      .mockResolvedValueOnce({ rows: [] });     // SELECT producto vacío

    await expect(PostgresOrderDAO.create({
      user_id: 1,
      restaurant_id: 5,
      reservation_id: 2,
      items: [{ product_id: 99, quantity: 1 }]
    })).rejects.toThrow("Producto 99 no existe");

    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    expect(mockClient.release).toHaveBeenCalled();
  });

  // Caso: producto no disponible
  it("debe lanzar error si el producto no está disponible", async () => {

    const fakeProduct = {
      id: 1,
      price: 4.50,
      available: false, // no disponible
      restaurant_id: 5
    };

    mockClient.query
      .mockResolvedValueOnce(null)                        // BEGIN
      .mockResolvedValueOnce({ rows: [fakeProduct] });    // SELECT producto

    await expect(PostgresOrderDAO.create({
      user_id: 1,
      restaurant_id: 5,
      reservation_id: 2,
      items: [{ product_id: 1, quantity: 1 }]
    })).rejects.toThrow("Producto 1 no disponible");

    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    expect(mockClient.release).toHaveBeenCalled();
  });

  // Caso: producto no pertenece al restaurante
  it("debe lanzar error si el producto no pertenece al restaurante", async () => {

    const fakeProduct = {
      id: 1,
      price: 4.50,
      available: true,
      restaurant_id: 99 // restaurante diferente
    };

    mockClient.query
      .mockResolvedValueOnce(null)                        // BEGIN
      .mockResolvedValueOnce({ rows: [fakeProduct] });    // SELECT producto

    await expect(PostgresOrderDAO.create({
      user_id: 1,
      restaurant_id: 5, // restaurante distinto al del producto
      reservation_id: 2,
      items: [{ product_id: 1, quantity: 1 }]
    })).rejects.toThrow("Producto 1 no pertenece al restaurante");

    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    expect(mockClient.release).toHaveBeenCalled();
  });

});

// ─────────────────────────────────────────────
// PRUEBAS: getById
// ─────────────────────────────────────────────
describe("PostgresOrderDAO - getById", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Caso exitoso: orden existe con sus items
  it("debe retornar la orden con sus items cuando existe", async () => {

    const fakeOrder = {
      id: 10,
      user_id: 1,
      restaurant_id: 5,
      reservation_id: 2,
      status: "PENDING",
      total: 9.00,
      created_at: "2026-01-01"
    };

    const fakeItems = [
      { id: 1, product_id: 1, name: "Tacos de Canasta", quantity: 2, price: 4.50 }
    ];

    // Primera query trae la orden, segunda trae los items
    pool.query
      .mockResolvedValueOnce({ rows: [fakeOrder] })
      .mockResolvedValueOnce({ rows: fakeItems });

    const result = await PostgresOrderDAO.getById(10);

    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ ...fakeOrder, items: fakeItems });
  });

  // Caso: la orden no existe
  it("debe retornar null si la orden no existe", async () => {

    pool.query.mockResolvedValueOnce({ rows: [] });

    const result = await PostgresOrderDAO.getById(99);

    // Solo hace 1 query, no busca items si no hay orden
    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(result).toBeNull();
  });

  // Caso: error en la base de datos
  it("debe propagar el error si falla la query", async () => {

    pool.query.mockRejectedValue(new Error("DB error"));

    await expect(PostgresOrderDAO.getById(1)).rejects.toThrow("DB error");
  });

});