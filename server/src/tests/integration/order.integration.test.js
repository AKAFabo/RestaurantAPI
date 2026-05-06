// order.integration.test.js
// Prueba de integración del módulo de órdenes
// Flujo completo: request HTTP → controller → service → DAO → BD en memoria

// ─────────────────────────────────────────────
// MOCK DE KEYCLOAK - debe ir primero
// ─────────────────────────────────────────────
jest.mock("../../keycloak/keycloak.js", () => {
  const session = require("express-session");
  return {
    keycloak: {
      middleware: () => (req, res, next) => {
        req.kauth = {
          grant: {
            access_token: {
              content: {
                email: "carlos.mora@lasazontica.com",
                realm_access: { roles: ["user"] }
              }
            }
          }
        };
        next();
      },
      protect: () => (req, res, next) => next()
    },
    memoryStore: new session.MemoryStore()
  };
});

import request from "supertest";
import mongoose from "mongoose";
import { setupDatabase, teardownDatabase } from "./helpers/setupDatabase.js";
import { seedOrder, clearOrder } from "./seeds/order.seed.js";
import { orderService } from "../../services/config.js";

const dbType = process.env.DB_TYPE || "mongo";

let app;
let pool;

// ─────────────────────────────────────────────
// SETUP
// ─────────────────────────────────────────────
beforeAll(async () => {
  const db = await setupDatabase();
  pool = db.pool || null;

  const module = await import("../../server.js");
  app = module.default;
});

afterAll(async () => {
  await teardownDatabase();
});

afterEach(async () => {
  await clearOrder(pool);
});

// ─────────────────────────────────────────────
// HELPER: crea un usuario falso válido para el mock
// ─────────────────────────────────────────────
const createFakeUser = () => {
  const fakeId = new mongoose.Types.ObjectId();
  return {
    _id: fakeId,
    id: fakeId.toString(),
    email: "carlos.mora@lasazontica.com"
  };
};

// ─────────────────────────────────────────────
// PRUEBAS: POST /api/orders
// ─────────────────────────────────────────────
describe(`POST /api/orders [${dbType}]`, () => {

  // Antes de cada test reseteamos getByEmail a un usuario válido
  beforeEach(() => {
    orderService.reservationDAO.getByEmail = jest.fn().mockResolvedValue(createFakeUser());
  });

  // Caso exitoso: orden creada correctamente
  it("debe retornar 201 con la orden creada", async () => {

    const { restaurantId, availableProductId } = await seedOrder(pool);

    const response = await request(app)
      .post("/api/orders")
      .send({
        restaurant_id: restaurantId,
        items: [{ product_id: availableProductId, quantity: 2 }]
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Pedido creado");
    expect(response.body.order).toBeDefined();
    expect(response.body.order.status).toBe("PENDING");
  });

  // Error 400: falta restaurant_id
  it("debe retornar 400 si falta restaurant_id", async () => {

    const response = await request(app)
      .post("/api/orders")
      .send({
        items: [{ product_id: "123", quantity: 1 }]
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("restaurant_id e items son requeridos");
  });

  // Error 400: items vacío
  it("debe retornar 400 si items está vacío", async () => {

    const { restaurantId } = await seedOrder(pool);

    const response = await request(app)
      .post("/api/orders")
      .send({
        restaurant_id: restaurantId,
        items: []
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("restaurant_id e items son requeridos");
  });

  // Error 404: usuario no existe en la BD
  it("debe retornar 404 si el usuario no existe en la BD", async () => {

    const { restaurantId, availableProductId } = await seedOrder(pool);

    // Sobreescribimos el mock para este test específico
    orderService.reservationDAO.getByEmail = jest.fn().mockResolvedValue(null);

    const response = await request(app)
      .post("/api/orders")
      .send({
        restaurant_id: restaurantId,
        items: [{ product_id: availableProductId, quantity: 1 }]
      });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Usuario no existe en la BD");
  });

});

// ─────────────────────────────────────────────
// PRUEBAS: GET /api/orders/:id
// ─────────────────────────────────────────────
describe(`GET /api/orders/:id [${dbType}]`, () => {

  // Antes de cada test reseteamos getByEmail a un usuario válido
  beforeEach(() => {
    orderService.reservationDAO.getByEmail = jest.fn().mockResolvedValue(createFakeUser());
  });

  // Caso exitoso: cliente ve su propia orden
  it("debe retornar 200 con la orden cuando el cliente es el dueño", async () => {

    const { restaurantId, availableProductId } = await seedOrder(pool);

    // Creamos la orden primero
    const createResponse = await request(app)
      .post("/api/orders")
      .send({
        restaurant_id: restaurantId,
        items: [{ product_id: availableProductId, quantity: 1 }]
      });

    expect(createResponse.status).toBe(201);

    const orderId = createResponse.body.order?._id || createResponse.body.order?.id;

    // Mockeamos getByEmail con el user_id de la orden creada
    orderService.reservationDAO.getByEmail = jest.fn().mockResolvedValue({
      _id: createResponse.body.order.user_id,
      id: createResponse.body.order.user_id,
      email: "carlos.mora@lasazontica.com"
    });

    // Consultamos la orden
    const response = await request(app)
      .get(`/api/orders/${orderId}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("PENDING");
  });

  // Error 404: la orden no existe
  it("debe retornar 404 si la orden no existe", async () => {

    const fakeId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .get(`/api/orders/${fakeId}`);

    expect(response.status).toBe(404);
  });

});