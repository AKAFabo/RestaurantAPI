import restaurantController from "../controllers/restaurantController.js";
import * as userDAO from "../daos/userDao.js";
import * as restaurantDAO from "../daos/restaurantDao.js";

jest.mock("../daos/userDao.js");
jest.mock("../daos/restaurantDao.js");

// Helper: default exports
const userDao = userDAO.default;
const restDao = restaurantDAO.default;

describe("createRestaurant", () => {

  //  Caso exitoso
  it("debe crear un restaurante correctamente", async () => {

    const fakeUser = { id: 1, email: "admin@mail.com" };
    const fakeRestaurant = { id: 10, name: "Mi Restaurante", address: "Calle 1", phone: "12345678", admin_id: 1 };

    userDao.getByEmail.mockResolvedValue(fakeUser);
    restDao.createRestaurant.mockResolvedValue(fakeRestaurant);

    const req = {
      body: { name: "Mi Restaurante", address: "Calle 1", phone: "12345678" },
      kauth: {
        grant: {
          access_token: {
            content: { email: "admin@mail.com" }
          }
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await restaurantController.createRestaurant(req, res);

    expect(userDao.getByEmail).toHaveBeenCalledWith("admin@mail.com");
    expect(restDao.createRestaurant).toHaveBeenCalledWith({
      name: "Mi Restaurante",
      address: "Calle 1",
      phone: "12345678",
      admin_id: 1
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(fakeRestaurant);
  });

  //  Faltan datos
  it("debe devolver 400 si faltan datos", async () => {

    const req = {
      body: { name: "Mi Restaurante" },
      kauth: {
        grant: {
          access_token: {
            content: { email: "admin@mail.com" }
          }
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await restaurantController.createRestaurant(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Name, address and phone are required" });
  });

  //  Usuario no encontrado
  it("debe devolver 404 si el usuario no existe", async () => {

    userDao.getByEmail.mockResolvedValue(null);

    const req = {
      body: { name: "Mi Restaurante", address: "Calle 1", phone: "12345678" },
      kauth: {
        grant: {
          access_token: {
            content: { email: "noexiste@mail.com" }
          }
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await restaurantController.createRestaurant(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  //  Error interno
  it("debe devolver 500 si ocurre un error", async () => {

    userDao.getByEmail.mockResolvedValue({ id: 1 });
    restDao.createRestaurant.mockRejectedValue(new Error("DB error"));

    const req = {
      body: { name: "Mi Restaurante", address: "Calle 1", phone: "12345678" },
      kauth: {
        grant: {
          access_token: {
            content: { email: "admin@mail.com" }
          }
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await restaurantController.createRestaurant(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error creating restaurant" });
  });

});


describe("getRestaurants", () => {

  //  Caso exitoso
  it("debe devolver la lista de restaurantes", async () => {

    const fakeRestaurants = [
      { id: 1, name: "Restaurante A" },
      { id: 2, name: "Restaurante B" }
    ];

    restDao.getRestaurants.mockResolvedValue(fakeRestaurants);

    const req = {};
    const res = {
      json: jest.fn()
    };

    await restaurantController.getRestaurants(req, res);

    expect(restDao.getRestaurants).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(fakeRestaurants);
  });

  //  Error interno
  it("debe devolver 500 si ocurre un error", async () => {

    restDao.getRestaurants.mockRejectedValue(new Error("DB error"));

    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await restaurantController.getRestaurants(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error fetching restaurants" });
  });

});


describe("createMenu", () => {

  //  Caso exitoso
  it("debe crear un menu correctamente", async () => {

    const fakeMenu = { id: 1, restaurant_id: 5, name: "Menu Almuerzo" };

    restDao.createMenu.mockResolvedValue(fakeMenu);

    const req = {
      params: { restaurantId: 5 },
      body: { name: "Menu Almuerzo" }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await restaurantController.createMenu(req, res);

    expect(restDao.createMenu).toHaveBeenCalledWith(5, { name: "Menu Almuerzo" });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(fakeMenu);
  });

  //  Falta nombre
  it("debe devolver 400 si falta el nombre del menu", async () => {

    const req = {
      params: { restaurantId: 5 },
      body: {}
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await restaurantController.createMenu(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Menu name is required" });
  });

  //  Error interno
  it("debe devolver 500 si ocurre un error", async () => {

    restDao.createMenu.mockRejectedValue(new Error("DB error"));

    const req = {
      params: { restaurantId: 5 },
      body: { name: "Menu Almuerzo" }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await restaurantController.createMenu(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error creating menu" });
  });

});
