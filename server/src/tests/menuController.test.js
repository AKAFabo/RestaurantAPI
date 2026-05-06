

import { getMenuById, updateMenubyId, deleteMenu, getAllProducts } from "../controllers/menuController.js";

// Mock del módulo de servicios - interceptamos menuService antes de que el controller lo use
jest.mock("../services/config.js", () => ({
  menuService: {
    getMenuById: jest.fn(),
    updateMenuById: jest.fn(),
    deleteMenu: jest.fn(),
    getAllProducts: jest.fn(),
  }
}));

// Importamos el mock para poder configurarlo en cada prueba
import { menuService } from "../services/config.js";


// PRUEBAS: getMenuById

describe("getMenuById", () => {

  beforeEach(() => {
    jest.clearAllMocks(); // limpia llamadas anteriores entre pruebas
  });

  // Caso exitoso: el menú existe
  it("debe devolver un menú cuando existe", async () => {

    const fakeMenu = { id: 1, name: "Menu 1", products: [] };

    menuService.getMenuById.mockResolvedValue(fakeMenu);

    const req = { params: { id: 1 } };
    const res = { json: jest.fn() };

    await getMenuById(req, res);

    // Verifica que el service fue llamado con el id correcto
    expect(menuService.getMenuById).toHaveBeenCalledWith(1);
    // Verifica que la respuesta contiene el menú
    expect(res.json).toHaveBeenCalledWith(fakeMenu);
  });

  // Error 400: falta el id en los parámetros
  it("debe devolver 400 si no hay id", async () => {

    const req = { params: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await getMenuById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Id requerido" });
  });

  // Error 404: el menú no existe en la base de datos
  it("debe devolver 404 si el menú no existe", async () => {

    menuService.getMenuById.mockResolvedValue(null);

    const req = { params: { id: 99 } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await getMenuById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Menu no encontrado" });
  });

  // Error 500: falla inesperada en el servicio
  it("debe devolver 500 si ocurre un error interno", async () => {

    menuService.getMenuById.mockRejectedValue(new Error("Error inesperado"));

    const req = { params: { id: 1 } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await getMenuById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error obteniendo el menu" });
  });

});


// PRUEBAS: updateMenubyId

describe("updateMenubyId", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Caso exitoso: actualización correcta
  it("debe actualizar un menú correctamente", async () => {

    const fakeMenu = { id: 1, name: "Nuevo nombre" };

    menuService.updateMenuById.mockResolvedValue(fakeMenu);

    const req = {
      params: { id: 1 },
      body: { name: "Nuevo nombre" }
    };
    const res = { json: jest.fn() };

    await updateMenubyId(req, res);

    // Verifica que el service recibió los parámetros correctos
    expect(menuService.updateMenuById).toHaveBeenCalledWith(1, "Nuevo nombre");
    expect(res.json).toHaveBeenCalledWith({
      message: "Menu actualizado",
      menu: fakeMenu
    });
  });

  // Error 400: falta el id
  it("debe devolver 400 si falta el id", async () => {

    const req = {
      params: {},
      body: { name: "Test" }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await updateMenubyId(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Id requerido" });
  });

  // Error 400: falta el nombre en el body
  it("debe devolver 400 si falta el nombre", async () => {

    const req = {
      params: { id: 1 },
      body: {}
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await updateMenubyId(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Nombre requerido" });
  });

  // Error 404: el menú a actualizar no existe
  it("debe devolver 404 si el menú no existe", async () => {

    menuService.updateMenuById.mockResolvedValue(null);

    const req = {
      params: { id: 99 },
      body: { name: "Test" }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await updateMenubyId(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Menu no encontrado" });
  });

  // Error 500: falla inesperada en el servicio
  it("debe devolver 500 si ocurre un error interno", async () => {

    menuService.updateMenuById.mockRejectedValue(new Error("Error inesperado"));

    const req = {
      params: { id: 1 },
      body: { name: "Test" }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await updateMenubyId(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error obteniendo el menu" });
  });

});


// PRUEBAS: deleteMenu

describe("deleteMenu", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Caso exitoso: eliminación correcta
  it("debe eliminar un menú correctamente", async () => {

    menuService.deleteMenu.mockResolvedValue({ id: 1 });

    const req = { params: { id: 1 } };
    const res = { json: jest.fn() };

    await deleteMenu(req, res);

    expect(menuService.deleteMenu).toHaveBeenCalledWith(1);
    expect(res.json).toHaveBeenCalledWith({ message: "Menú eliminado correctamente" });
  });

  // Error 400: falta el id
  it("debe devolver 400 si falta el id", async () => {

    const req = { params: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await deleteMenu(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "ID requerido" });
  });

  // Error 404: el menú a eliminar no existe
  it("debe devolver 404 si el menú no existe", async () => {

    menuService.deleteMenu.mockResolvedValue(null);

    const req = { params: { id: 99 } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await deleteMenu(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Menú no encontrado" });
  });

  // Error 500: falla inesperada en el servicio
  it("debe devolver 500 si ocurre un error interno", async () => {

    menuService.deleteMenu.mockRejectedValue(new Error("Error inesperado"));

    const req = { params: { id: 1 } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await deleteMenu(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error eliminando menú" });
  });

});


// PRUEBAS: getAllProducts

describe("getAllProducts", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Caso exitoso: retorna lista de productos
  it("debe devolver todos los productos", async () => {

    const fakeProducts = [
      { id: 1, name: "Tacos de Canasta", price: 4.50 },
      { id: 2, name: "Agua de Jamaica", price: 2.00 }
    ];

    menuService.getAllProducts.mockResolvedValue(fakeProducts);

    const req = {};
    const res = { json: jest.fn() };

    await getAllProducts(req, res);

    expect(menuService.getAllProducts).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(fakeProducts);
  });

  // Error 500: falla inesperada en el servicio
  it("debe devolver 500 si ocurre un error interno", async () => {

    menuService.getAllProducts.mockRejectedValue(new Error("Error inesperado"));

    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await getAllProducts(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error obteniendo productos" });
  });

});