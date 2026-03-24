import { getMenuById } from "../controllers/menuController.js";
import * as menuDao from "../daos/menuDao.js";
import { updateMenubyId } from "../controllers/menuController.js";
import { deleteMenu } from "../controllers/menuController.js";


// mock del DAO 
jest.mock("../daos/menuDao.js");

describe("getMenuById", () => {

  //  Caso exitoso
  it("debe devolver un menu cuando existe", async () => {

    const fakeMenu = {
      id: 1,
      name: "Menu 1",
      products: []
    };

    menuDao.getMenuById.mockResolvedValue(fakeMenu);

    const req = {
      params: { id: 1 }
    };

    const res = {
      json: jest.fn()
    };

    await getMenuById(req, res);

    expect(menuDao.getMenuById).toHaveBeenCalledWith(1);
    expect(res.json).toHaveBeenCalledWith(fakeMenu);
  });

  //  Falta ID
  it("debe devolver 400 si no hay id", async () => {

    const req = {
      params: {}
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await getMenuById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Id requerido" });
  });

  //  Menu no existe
  it("debe devolver 404 si no existe el menu", async () => {

    menuDao.getMenuById.mockResolvedValue(null);

    const req = {
      params: { id: 99 }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await getMenuById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Menu no encontrado" });
  });

  //  Error interno
  it("debe devolver 500 si ocurre un error", async () => {

    menuDao.getMenuById.mockRejectedValue(new Error("DB error"));

    const req = {
      params: { id: 1 }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await getMenuById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error obteniendo el menu" });
  });

});





describe("updateMenubyId", () => {

  //  Actualización exitosa
  it("debe actualizar un menu correctamente", async () => {

    const fakeMenu = {
      id: 1,
      name: "Nuevo nombre"
    };

    menuDao.updateMenubyId.mockResolvedValue(fakeMenu);

    const req = {
      params: { id: 1 },
      body: { name: "Nuevo nombre" }
    };

    const res = {
      json: jest.fn()
    };

    await updateMenubyId(req, res);

    expect(menuDao.updateMenubyId).toHaveBeenCalledWith(1, "Nuevo nombre");
    expect(res.json).toHaveBeenCalledWith({
      message: "Menu actualizado",
      menu: fakeMenu
    });
  });

  //  Falta ID
  it("debe devolver 400 si falta id", async () => {

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

  //  Falta name
  it("debe devolver 400 si falta name", async () => {

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

  //  No existe
  it("debe devolver 404 si el menu no existe", async () => {

    menuDao.updateMenubyId.mockResolvedValue(null);

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

  // Error interno
  it("debe devolver 500 si ocurre un error", async () => {

    menuDao.updateMenubyId.mockRejectedValue(new Error("DB error"));

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


////////


describe("deleteMenu", () => {

  // ✅ 1. Eliminación exitosa
  it("debe eliminar un menú correctamente", async () => {

    menuDao.deleteMenu.mockResolvedValue({ id: 1 });

    const req = {
      params: { id: 1 }
    };

    const res = {
      json: jest.fn()
    };

    await deleteMenu(req, res);

    expect(menuDao.deleteMenu).toHaveBeenCalledWith(1);
    expect(res.json).toHaveBeenCalledWith({
      message: "Menú eliminado correctamente"
    });
  });

  // ❌ 2. Falta ID
  it("debe devolver 400 si falta id", async () => {

    const req = {
      params: {}
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await deleteMenu(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "ID requerido"
    });
  });

  // ❌ 3. No existe
  it("debe devolver 404 si el menú no existe", async () => {

    menuDao.deleteMenu.mockResolvedValue(null);

    const req = {
      params: { id: 99 }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await deleteMenu(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "Menú no encontrado"
    });
  });

  // ❌ 4. Error interno
  it("debe devolver 500 si ocurre un error", async () => {

    menuDao.deleteMenu.mockRejectedValue(new Error("DB error"));

    const req = {
      params: { id: 1 }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await deleteMenu(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Error eliminando menú"
    });
  });

});