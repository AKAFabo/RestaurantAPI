
// Mockea el modelo de Mongoose para no depender de una base de datos real

import mongoose from "mongoose";
import MongoMenuDAO from "../daos/menu/menu.mongo.dao.js";

// Mock del modelo Menu de Mongoose intercepta todas las operaciones
jest.mock("../models/menu.Model.js", () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  find: jest.fn(),
}));

// Mock de mongoose para controlar ObjectId
jest.mock("mongoose", () => ({
  Types: {
    ObjectId: jest.fn().mockImplementation((id) => id) // retorna el id tal cual
  }
}));

import Menu from "../models/menu.Model.js";

// PRUEBAS: getMenuById

describe("MongoMenuDAO - getMenuById", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Caso exitoso: el menú existe con productos
  it("debe retornar el menú cuando existe", async () => {

    const fakeMenu = {
      _id: "abc123",
      name: "Menú del día",
      products: [
        { _id: "p1", name: "Tacos de Canasta", description: "Rellenos de frijol", price: 4.50, category: "Antojitos" },
        { _id: "p2", name: "Agua de Jamaica", description: "Bebida fría natural", price: 2.00, category: "Bebidas" }
      ]
    };

    // Simula la cadena findById().lean()
    Menu.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(fakeMenu)
    });

    const result = await MongoMenuDAO.getMenuById("abc123");

    expect(mongoose.Types.ObjectId).toHaveBeenCalledWith("abc123");
    expect(Menu.findById).toHaveBeenCalled();
    expect(result).toEqual(fakeMenu);
  });

  // Caso: el menú no existe
  it("debe retornar null si el menú no existe", async () => {

    Menu.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null)
    });

    const result = await MongoMenuDAO.getMenuById("noexiste");

    expect(result).toBeNull();
  });

  // Caso: error en la base de datos
  it("debe propagar el error si falla la query", async () => {

    Menu.findById.mockReturnValue({
      lean: jest.fn().mockRejectedValue(new Error("DB error"))
    });

    await expect(MongoMenuDAO.getMenuById("abc123")).rejects.toThrow("DB error");
  });

});


// PRUEBAS: updateMenuById

describe("MongoMenuDAO - updateMenuById", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Caso exitoso: actualización correcta
  it("debe actualizar y retornar el menú actualizado", async () => {

    const fakeMenu = {
      _id: "abc123",
      name: "Nuevo nombre",
      products: []
    };

    // Simula la cadena findByIdAndUpdate().lean()
    Menu.findByIdAndUpdate.mockReturnValue({
      lean: jest.fn().mockResolvedValue(fakeMenu)
    });

    const result = await MongoMenuDAO.updateMenuById("abc123", "Nuevo nombre");

    // Verifica que se llamo con el id, el nombre y la opción new:true
    expect(Menu.findByIdAndUpdate).toHaveBeenCalledWith(
    expect.anything(), // ObjectId mockeado
    { name: "Nuevo nombre" },
    { new: true }
    );
    expect(result).toEqual(fakeMenu);
  });

  // Caso: el menú no existe
  it("debe retornar null si el menú no existe", async () => {

    Menu.findByIdAndUpdate.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null)
    });

    const result = await MongoMenuDAO.updateMenuById("noexiste", "Test");

    expect(result).toBeNull();
  });

  // Caso: error en la base de datos
  it("debe propagar el error si falla la query", async () => {

    Menu.findByIdAndUpdate.mockReturnValue({
      lean: jest.fn().mockRejectedValue(new Error("DB error"))
    });

    await expect(MongoMenuDAO.updateMenuById("abc123", "Test")).rejects.toThrow("DB error");
  });

});


// PRUEBAS: deleteMenu

describe("MongoMenuDAO - deleteMenu", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Caso exitoso: elimina y retorna el menú eliminado
  it("debe eliminar y retornar el menú eliminado", async () => {

    const fakeMenu = { _id: "abc123", name: "Menú eliminado" };

    // Simula la cadena findByIdAndDelete().lean()
    Menu.findByIdAndDelete.mockReturnValue({
      lean: jest.fn().mockResolvedValue(fakeMenu)
    });

    const result = await MongoMenuDAO.deleteMenu("abc123");

    expect(Menu.findByIdAndDelete).toHaveBeenCalledWith("abc123");
    expect(result).toEqual(fakeMenu);
  });

  // Caso: el menú no existe
  it("debe retornar null si el menú no existe", async () => {

    Menu.findByIdAndDelete.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null)
    });

    const result = await MongoMenuDAO.deleteMenu("noexiste");

    expect(result).toBeNull();
  });

  // Caso: error en la base de datos
  it("debe propagar el error si falla la query", async () => {

    Menu.findByIdAndDelete.mockReturnValue({
      lean: jest.fn().mockRejectedValue(new Error("DB error"))
    });

    await expect(MongoMenuDAO.deleteMenu("abc123")).rejects.toThrow("DB error");
  });

});


// PRUEBAS: getAllProducts

describe("MongoMenuDAO - getAllProducts", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Caso exitoso: retorna productos de todos los menús
  it("debe retornar todos los productos de todos los menús", async () => {

    const fakeMenus = [
      {
        _id: "menu1",
        name: "Menú Mexicano",
        products: [
          { _id: "p1", name: "Tacos de Canasta", description: "Rellenos de frijol", category: "Antojitos", price: 4.50 },
          { _id: "p2", name: "Enchiladas Verdes", description: "Con pollo y salsa verde", category: "Platos fuertes", price: 8.00 }
        ]
      },
      {
        _id: "menu2",
        name: "Menú Bebidas",
        products: [
          { _id: "p3", name: "Agua de Jamaica", description: "Bebida fría natural", category: "Bebidas", price: 2.00 }
        ]
      }
    ];

    Menu.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue(fakeMenus)
    });

    const result = await MongoMenuDAO.getAllProducts();

    // Verifica que retorna los productos aplanados de todos los menús
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      id: "p1",
      name: "Tacos de Canasta",
      description: "Rellenos de frijol",
      category: "Antojitos",
      price: 4.50
    });
  });

  // Caso: un menú no tiene productos, se ignora
  it("debe ignorar menús sin productos y no lanzar error", async () => {

    const fakeMenus = [
      { _id: "menu1", name: "Menú sin productos" }, // sin campo products
      {
        _id: "menu2",
        name: "Menú con productos",
        products: [
          { _id: "p1", name: "Tacos de Canasta", description: null, category: "Antojitos", price: 4.50 }
        ]
      }
    ];

    Menu.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue(fakeMenus)
    });

    const result = await MongoMenuDAO.getAllProducts();

    // Solo retorna el producto del menú que sí tiene productos
    expect(result).toHaveLength(1);
    // Verifica que usa el texto por defecto cuando description es null
    expect(result[0].description).toBe("Producto sin descripción");
  });

  // Caso: no hay menús en la base de datos
  it("debe retornar lista vacía si no hay menús", async () => {

    Menu.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([])
    });

    const result = await MongoMenuDAO.getAllProducts();

    expect(result).toEqual([]);
  });

  // Caso: error en la base de datos
  it("debe propagar el error si falla la query", async () => {

    Menu.find.mockReturnValue({
      lean: jest.fn().mockRejectedValue(new Error("DB error"))
    });

    await expect(MongoMenuDAO.getAllProducts()).rejects.toThrow("DB error");
  });

});