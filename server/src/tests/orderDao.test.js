import { create, getById } from "../daos/orderDao.js";
import { pool } from "../config/database.js";

jest.mock("../config/database.js", () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn()
  }
}));

describe("create", () => {

  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    pool.connect.mockResolvedValue(mockClient);
  });

  //  Caso exitoso
  it("debe crear un pedido correctamente", async () => {

    const fakeProduct = { id: 1, price: 500, available: true, restaurant_id: 1 };
    const fakeOrder = { id: 10, user_id: 1, restaurant_id: 1, total: 1000, status: "PENDING" };

    mockClient.query
      .mockResolvedValueOnce()                                    // BEGIN
      .mockResolvedValueOnce({ rows: [fakeProduct] })             // SELECT product
      .mockResolvedValueOnce({ rows: [fakeOrder] })               // INSERT order
      .mockResolvedValueOnce()                                    // INSERT order_item
      .mockResolvedValueOnce();                                   // COMMIT

    const result = await create({
      user_id: 1,
      restaurant_id: 1,
      reservation_id: 2,
      items: [{ product_id: 1, quantity: 2 }]
    });

    expect(result).toEqual(fakeOrder);
    expect(mockClient.release).toHaveBeenCalled();
  });

  //  Items vacíos
  it("debe lanzar error si items están vacíos", async () => {

    mockClient.query.mockResolvedValueOnce(); // BEGIN

    await expect(create({
      user_id: 1,
      restaurant_id: 1,
      reservation_id: 2,
      items: []
    })).rejects.toThrow("Items inválidos");

    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    expect(mockClient.release).toHaveBeenCalled();
  });

  //  Producto no existe
  it("debe lanzar error si un producto no existe", async () => {

    mockClient.query
      .mockResolvedValueOnce()                    // BEGIN
      .mockResolvedValueOnce({ rows: [] });       // SELECT product (vacío)

    await expect(create({
      user_id: 1,
      restaurant_id: 1,
      reservation_id: 2,
      items: [{ product_id: 99, quantity: 1 }]
    })).rejects.toThrow("Producto 99 no existe");

    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
  });

  //  Producto no disponible
  it("debe lanzar error si un producto no está disponible", async () => {

    const unavailableProduct = { id: 1, price: 500, available: false, restaurant_id: 1 };

    mockClient.query
      .mockResolvedValueOnce()                                    // BEGIN
      .mockResolvedValueOnce({ rows: [unavailableProduct] });     // SELECT product

    await expect(create({
      user_id: 1,
      restaurant_id: 1,
      reservation_id: 2,
      items: [{ product_id: 1, quantity: 1 }]
    })).rejects.toThrow("Producto 1 no disponible");
  });

  //  Producto de otro restaurante
  it("debe lanzar error si el producto no pertenece al restaurante", async () => {

    const wrongRestProduct = { id: 1, price: 500, available: true, restaurant_id: 99 };

    mockClient.query
      .mockResolvedValueOnce()                                    // BEGIN
      .mockResolvedValueOnce({ rows: [wrongRestProduct] });       // SELECT product

    await expect(create({
      user_id: 1,
      restaurant_id: 1,
      reservation_id: 2,
      items: [{ product_id: 1, quantity: 1 }]
    })).rejects.toThrow("Producto 1 no pertenece al restaurante");
  });

  //  Cantidad inválida
  it("debe lanzar error si la cantidad es inválida", async () => {

    mockClient.query.mockResolvedValueOnce(); // BEGIN

    await expect(create({
      user_id: 1,
      restaurant_id: 1,
      reservation_id: 2,
      items: [{ product_id: 1, quantity: 0 }]
    })).rejects.toThrow("Cantidad inválida para producto 1");
  });

});


describe("getById", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  //  Caso exitoso
  it("debe devolver un pedido con sus items", async () => {

    const fakeOrder = { id: 10, user_id: 1, restaurant_id: 1, total: 1000 };
    const fakeItems = [{ id: 1, product_id: 1, name: "Producto", quantity: 2, price: 500 }];

    pool.query
      .mockResolvedValueOnce({ rows: [fakeOrder] })
      .mockResolvedValueOnce({ rows: fakeItems });

    const result = await getById(10);

    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ ...fakeOrder, items: fakeItems });
  });

  //  No existe
  it("debe devolver null si el pedido no existe", async () => {

    pool.query.mockResolvedValueOnce({ rows: [] });

    const result = await getById(99);

    expect(result).toBeNull();
  });

  //  Error de BD
  it("debe lanzar error si falla la consulta", async () => {

    pool.query.mockRejectedValue(new Error("DB error"));

    await expect(getById(1)).rejects.toThrow("DB error");
  });

});
