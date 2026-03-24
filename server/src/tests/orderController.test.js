import { createOrder } from "../controllers/orderController.js";
import { getOrderById } from "../controllers/orderController.js";

import * as orderDAO from "../daos/orderDao.js";
import * as userDAO from "../daos/reservationDao.js";

jest.mock("../daos/orderDao.js");
jest.mock("../daos/reservationDao.js");

describe("createOrder", () => {

  //  Caso exitoso
  it("debe crear un pedido correctamente", async () => {

    const fakeUser = { id: 1 };
    const fakeOrder = { id: 10, total: 5000 };

    userDAO.getByEmail.mockResolvedValue(fakeUser);
    orderDAO.create.mockResolvedValue(fakeOrder);

    const req = {
      body: {
        restaurant_id: 1,
        reservation_id: 2,
        items: [{ product_id: 1, quantity: 2 }]
      },
      kauth: {
        grant: {
          access_token: {
            content: { email: "test@mail.com" }
          }
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await createOrder(req, res);

    expect(userDAO.getByEmail).toHaveBeenCalledWith("test@mail.com");

    expect(orderDAO.create).toHaveBeenCalledWith({
      user_id: 1,
      restaurant_id: 1,
      reservation_id: 2,
      items: [{ product_id: 1, quantity: 2 }]
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Pedido creado",
      order: fakeOrder
    });
  });

  // Faltan datos
  it("debe devolver 400 si faltan datos", async () => {

    const req = {
      body: {},
      kauth: {
        grant: {
          access_token: {
            content: { email: "test@mail.com" }
          }
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "restaurant_id e items son requeridos"
    });
  });

  //  Usuario no autenticado
  it("debe devolver 401 si no hay usuario autenticado", async () => {

    const req = {
      body: {
        restaurant_id: 1,
        items: [{ product_id: 1, quantity: 2 }]
      },
      kauth: {}
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Usuario no autenticado"
    });
  });

  //  Usuario no existe
  it("debe devolver 404 si el usuario no existe", async () => {

    userDAO.getByEmail.mockResolvedValue(null);

    const req = {
      body: {
        restaurant_id: 1,
        items: [{ product_id: 1, quantity: 2 }]
      },
      kauth: {
        grant: {
          access_token: {
            content: { email: "test@mail.com" }
          }
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "Usuario no existe en la BD"
    });
  });

  //  Error interno
  it("debe devolver 500 si ocurre un error", async () => {

    userDAO.getByEmail.mockResolvedValue({ id: 1 });
    orderDAO.create.mockRejectedValue(new Error("DB error"));

    const req = {
      body: {
        restaurant_id: 1,
        items: [{ product_id: 1, quantity: 2 }]
      },
      kauth: {
        grant: {
          access_token: {
            content: { email: "test@mail.com" }
          }
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});




describe("getOrderById", () => {

  //  Admin puede ver cualquier pedido
  it("debe permitir acceso si es admin", async () => {

    const fakeUser = { id: 1 };
    const fakeOrder = { id: 10, user_id: 2 };

    userDAO.getByEmail.mockResolvedValue(fakeUser);
    orderDAO.getById.mockResolvedValue(fakeOrder);

    const req = {
      params: { id: 10 },
      kauth: {
        grant: {
          access_token: {
            content: {
              email: "admin@mail.com",
              realm_access: { roles: ["admin"] }
            }
          }
        }
      }
    };

    const res = {
      json: jest.fn()
    };

    await getOrderById(req, res);

    expect(res.json).toHaveBeenCalledWith(fakeOrder);
  });

  // Usuario dueño puede ver su pedido
  it("debe permitir acceso si es el dueño", async () => {

    const fakeUser = { id: 1 };
    const fakeOrder = { id: 10, user_id: 1 };

    userDAO.getByEmail.mockResolvedValue(fakeUser);
    orderDAO.getById.mockResolvedValue(fakeOrder);

    const req = {
      params: { id: 10 },
      kauth: {
        grant: {
          access_token: {
            content: {
              email: "user@mail.com",
              realm_access: { roles: ["client"] }
            }
          }
        }
      }
    };

    const res = {
      json: jest.fn()
    };

    await getOrderById(req, res);

    expect(res.json).toHaveBeenCalledWith(fakeOrder);
  });

  //  Falta ID
  it("debe devolver 400 si falta id", async () => {

    const req = {
      params: {},
      kauth: {
        grant: {
          access_token: {
            content: { email: "test@mail.com" }
          }
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await getOrderById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  //  Usuario no autenticado
  it("debe devolver 401 si no hay usuario autenticado", async () => {

    const req = {
      params: { id: 1 },
      kauth: {}
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await getOrderById(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  //  Usuario no existe
  it("debe devolver 404 si el usuario no existe", async () => {

    userDAO.getByEmail.mockResolvedValue(null);

    const req = {
      params: { id: 1 },
      kauth: {
        grant: {
          access_token: {
            content: { email: "test@mail.com" }
          }
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await getOrderById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  // Pedido no existe
  it("debe devolver 404 si el pedido no existe", async () => {

    userDAO.getByEmail.mockResolvedValue({ id: 1 });
    orderDAO.getById.mockResolvedValue(null);

    const req = {
      params: { id: 99 },
      kauth: {
        grant: {
          access_token: {
            content: { email: "test@mail.com" }
          }
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await getOrderById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  //  No es dueño ni admin
  it("debe devolver 403 si no tiene permiso", async () => {

    userDAO.getByEmail.mockResolvedValue({ id: 1 });
    orderDAO.getById.mockResolvedValue({ id: 10, user_id: 2 });

    const req = {
      params: { id: 10 },
      kauth: {
        grant: {
          access_token: {
            content: {
              email: "user@mail.com",
              realm_access: { roles: ["client"] }
            }
          }
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await getOrderById(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  //  Error interno
  it("debe devolver 500 si ocurre un error", async () => {

    userDAO.getByEmail.mockResolvedValue({ id: 1 });
    orderDAO.getById.mockRejectedValue(new Error("DB error"));

    const req = {
      params: { id: 1 },
      kauth: {
        grant: {
          access_token: {
            content: { email: "test@mail.com" }
          }
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await getOrderById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});