

import { createOrder, getOrderById } from "../controllers/orderController.js";

// Mock del módulo de servicios - interceptamos orderService
jest.mock("../services/config.js", () => ({
  orderService: {
    createOrder: jest.fn(),
    getOrderById: jest.fn(),
  }
}));

import { orderService } from "../services/config.js";

// ─────────────────────────────────────────────
// PRUEBAS: createOrder
// ─────────────────────────────────────────────
describe("createOrder", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Caso exitoso: orden creada correctamente
  it("debe crear una orden y retornar 201", async () => {

    const fakeOrder = {
      id: 10,
      user_id: 1,
      restaurant_id: 5,
      items: [{ product_id: 1, quantity: 2 }]
    };

    orderService.createOrder.mockResolvedValue({ order: fakeOrder });

    const req = {
      body: {
        restaurant_id: 5,
        reservation_id: 2,
        items: [{ product_id: 1, quantity: 2 }]
      },
      // Simula el token de Keycloak con el email del usuario
      kauth: {
        grant: {
          access_token: {
            content: { email: "cliente@restaurante.com" }
          }
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await createOrder(req, res);

    expect(orderService.createOrder).toHaveBeenCalledWith({
      email: "cliente@restaurante.com",
      restaurant_id: 5,
      reservation_id: 2,
      items: [{ product_id: 1, quantity: 2 }]
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Pedido creado",
      order: fakeOrder
    });
  });

  // Error 400: falta restaurant_id
  it("debe retornar 400 si falta restaurant_id", async () => {

    const req = {
      body: {
        items: [{ product_id: 1, quantity: 2 }]
      },
      kauth: {
        grant: {
          access_token: {
            content: { email: "cliente@restaurante.com" }
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

  // Error 400: items viene vacío
  it("debe retornar 400 si items está vacío", async () => {

    const req = {
      body: {
        restaurant_id: 5,
        items: [] // lista vacía
      },
      kauth: {
        grant: {
          access_token: {
            content: { email: "cliente@restaurante.com" }
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

  // Error 401: no hay usuario autenticado en el token
  it("debe retornar 401 si no hay usuario autenticado", async () => {

    const req = {
      body: {
        restaurant_id: 5,
        items: [{ product_id: 1, quantity: 2 }]
      },
      kauth: null // sin token de Keycloak
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

  // Error 404: el usuario no existe en la base de datos
  it("debe retornar 404 si el usuario no existe en la BD", async () => {

    orderService.createOrder.mockResolvedValue({ error: "USER_NOT_FOUND" });

    const req = {
      body: {
        restaurant_id: 5,
        items: [{ product_id: 1, quantity: 2 }]
      },
      kauth: {
        grant: {
          access_token: {
            content: { email: "noexiste@restaurante.com" }
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

  // Error 500: falla inesperada en el service
  it("debe retornar 500 si ocurre un error interno", async () => {

    orderService.createOrder.mockRejectedValue(new Error("Error inesperado"));

    const req = {
      body: {
        restaurant_id: 5,
        items: [{ product_id: 1, quantity: 2 }]
      },
      kauth: {
        grant: {
          access_token: {
            content: { email: "cliente@restaurante.com" }
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
    expect(res.json).toHaveBeenCalledWith({
      error: "Error inesperado"
    });
  });

});

// ─────────────────────────────────────────────
// PRUEBAS: getOrderById
// ─────────────────────────────────────────────
describe("getOrderById", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Caso exitoso: retorna la orden correctamente
  it("debe retornar la orden cuando existe y el usuario tiene permiso", async () => {

    const fakeOrder = { id: 10, user_id: 1, restaurant_id: 5 };

    orderService.getOrderById.mockResolvedValue({ order: fakeOrder });

    const req = {
      params: { id: 10 },
      kauth: {
        grant: {
          access_token: {
            content: {
              email: "cliente@restaurante.com",
              realm_access: { roles: ["user"] }
            }
          }
        }
      }
    };

    const res = { json: jest.fn() };

    await getOrderById(req, res);

    expect(orderService.getOrderById).toHaveBeenCalledWith({
      id: 10,
      email: "cliente@restaurante.com",
      roles: ["user"]
    });
    expect(res.json).toHaveBeenCalledWith(fakeOrder);
  });

  // Error 400: falta el id en los parámetros
  it("debe retornar 400 si falta el id", async () => {

    const req = {
      params: {},
      kauth: {
        grant: {
          access_token: {
            content: {
              email: "cliente@restaurante.com",
              realm_access: { roles: ["user"] }
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

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "ID requerido" });
  });

  // Error 401: no hay usuario autenticado
  it("debe retornar 401 si no hay usuario autenticado", async () => {

    const req = {
      params: { id: 10 },
      kauth: null // sin token
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await getOrderById(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Usuario no autenticado" });
  });

  // Error 404: usuario no existe en la BD
  it("debe retornar 404 si el usuario no existe en la BD", async () => {

    orderService.getOrderById.mockResolvedValue({ error: "USER_NOT_FOUND" });

    const req = {
      params: { id: 10 },
      kauth: {
        grant: {
          access_token: {
            content: {
              email: "noexiste@restaurante.com",
              realm_access: { roles: ["user"] }
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

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Usuario no existe en la BD" });
  });

  // Error 404: la orden no existe
  it("debe retornar 404 si la orden no existe", async () => {

    orderService.getOrderById.mockResolvedValue({ error: "ORDER_NOT_FOUND" });

    const req = {
      params: { id: 99 },
      kauth: {
        grant: {
          access_token: {
            content: {
              email: "cliente@restaurante.com",
              realm_access: { roles: ["user"] }
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

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Pedido no encontrado" });
  });

  // Error 403: el cliente intenta ver la orden de otro usuario
  it("debe retornar 403 si el usuario no tiene permiso", async () => {

    orderService.getOrderById.mockResolvedValue({ error: "FORBIDDEN" });

    const req = {
      params: { id: 10 },
      kauth: {
        grant: {
          access_token: {
            content: {
              email: "cliente@restaurante.com",
              realm_access: { roles: ["user"] }
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
    expect(res.json).toHaveBeenCalledWith({
      error: "No tienes permiso para ver este pedido"
    });
  });

  // Error 500: falla inesperada en el service
  it("debe retornar 500 si ocurre un error interno", async () => {

    orderService.getOrderById.mockRejectedValue(new Error("Error inesperado"));

    const req = {
      params: { id: 10 },
      kauth: {
        grant: {
          access_token: {
            content: {
              email: "cliente@restaurante.com",
              realm_access: { roles: ["user"] }
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

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error obteniendo pedido" });
  });

});