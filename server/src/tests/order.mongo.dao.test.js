import MongoOrderDAO from "../daos/orders/order.mongo.dao.js";
import mongoose from "mongoose";

// Mockear ObjectId para evitar errores BSON
beforeAll(() => {
  jest.spyOn(mongoose.Types, "ObjectId").mockImplementation((id) => id);
});

// ─────────────────────────────
// MOCKS
// ─────────────────────────────
jest.mock("../models/order.Model.js", () => ({
  create: jest.fn(),
  findById: jest.fn()
}));

jest.mock("../models/menu.Model.js", () => ({
  findOne: jest.fn()
}));

import Order from "../models/order.Model.js";
import Menu from "../models/menu.Model.js";

// ─────────────────────────────
// PRUEBAS: create
// ─────────────────────────────
describe("MongoOrderDAO - create", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("debe crear la orden correctamente", async () => {

    const fakeMenu = {
      products: [
        {
          _id: 1,
          name: "Taco",
          price: 4.5,
          available: true
        }
      ]
    };

    const fakeOrder = {
      _id: "mongo123",
      status: "PENDING",
      total: 9
    };

    // Mock: encuentra el producto en el menú
    Menu.findOne.mockResolvedValue(fakeMenu);

    // Mock: crea la orden
    Order.create.mockResolvedValue(fakeOrder);

    const result = await MongoOrderDAO.create({
      user_id: 1,
      restaurant_id: 5,
      reservation_id: 2,
      items: [{ product_id: 1, quantity: 2 }]
    });

    expect(Menu.findOne).toHaveBeenCalled();
    expect(Order.create).toHaveBeenCalled();
    expect(result).toEqual(fakeOrder);
  });

  it("debe lanzar error si items está vacío", async () => {

    await expect(
      MongoOrderDAO.create({
        user_id: 1,
        restaurant_id: 5,
        items: []
      })
    ).rejects.toThrow("Items inválidos");

    expect(Order.create).not.toHaveBeenCalled();
  });

  it("debe lanzar error si la cantidad es inválida", async () => {

    await expect(
      MongoOrderDAO.create({
        user_id: 1,
        restaurant_id: 5,
        items: [{ product_id: 1, quantity: 0 }]
      })
    ).rejects.toThrow("Cantidad inválida para producto 1");
  });

  it("debe lanzar error si el producto no existe en el menú", async () => {

    Menu.findOne.mockResolvedValue(null);

    await expect(
      MongoOrderDAO.create({
        user_id: 1,
        restaurant_id: 5,
        items: [{ product_id: 1, quantity: 2 }]
      })
    ).rejects.toThrow("Producto 1 no existe o no pertenece al restaurante");
  });

  it("debe lanzar error si el producto no está disponible", async () => {

    Menu.findOne.mockResolvedValue({
      products: [
        {
          _id: 1,
          name: "Taco",
          price: 4.5,
          available: false
        }
      ]
    });

    await expect(
      MongoOrderDAO.create({
        user_id: 1,
        restaurant_id: 5,
        items: [{ product_id: 1, quantity: 2 }]
      })
    ).rejects.toThrow("Producto 1 no disponible");
  });

  it("debe propagar error de la DB", async () => {

    Menu.findOne.mockResolvedValue({
      products: [
        {
          _id: 1,
          name: "Taco",
          price: 4.5,
          available: true
        }
      ]
    });

    Order.create.mockRejectedValue(new Error("DB error"));

    await expect(
      MongoOrderDAO.create({
        user_id: 1,
        restaurant_id: 5,
        items: [{ product_id: 1, quantity: 2 }]
      })
    ).rejects.toThrow("DB error");
  });

});

// ─────────────────────────────
// PRUEBAS: getById
// ─────────────────────────────
describe("MongoOrderDAO - getById", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("debe retornar la orden cuando existe", async () => {

    const fakeOrder = { _id: "123", total: 10 };

    Order.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(fakeOrder)
    });

    const result = await MongoOrderDAO.getById("123");

    expect(Order.findById).toHaveBeenCalledWith(expect.anything());
    expect(result).toEqual(fakeOrder);
  });

  it("debe retornar null si no existe", async () => {

    Order.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null)
    });

    const result = await MongoOrderDAO.getById("noexiste");

    expect(result).toBeNull();
  });

  it("debe propagar error", async () => {

    Order.findById.mockReturnValue({
      lean: jest.fn().mockRejectedValue(new Error("DB error"))
    });

    await expect(
      MongoOrderDAO.getById("123")
    ).rejects.toThrow("DB error");
  });

});