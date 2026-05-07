
process.env.DB = "mongo";
process.env.DB_TYPE = "mongo";


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

jest.mock("../../config/redis.js", () => ({
  default: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(null),
    keys: jest.fn().mockResolvedValue([]),
    connect: jest.fn().mockResolvedValue(null),
    on: jest.fn()
  }
}));

jest.mock("../../middlewares/cache.js", () => ({
  cache: () => (req, res, next) => next()
}));

jest.mock("../../middlewares/cacheHelper.js", () => ({
  invalidateMenusCache: jest.fn().mockResolvedValue(null),
  invalidateUsersCache: jest.fn().mockResolvedValue(null),
  invalidateUserCache: jest.fn().mockResolvedValue(null),
  invalidateRestaurantsCache: jest.fn().mockResolvedValue(null),
  invalidateOrdersCache: jest.fn().mockResolvedValue(null),
}));

jest.mock("../../config/database.js", () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(null),
  pool: {
    query: jest.fn().mockResolvedValue({ rows: [] }),
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    })
  },
  getDatabaseStatus: jest.fn().mockReturnValue("connected")
}));

import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { seedOrder, clearOrder } from "./seeds/order.seed.js";
import { mockAdminUser } from "./helpers/mockKeycloak.js";

const dbType = "mongo";
let app;
let mongoServer;

// ─────────────────────────────────────────────
// SETUP
// ─────────────────────────────────────────────
beforeAll(async () => {

  //  Levantar MongoDB en memoria
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGO_URI = uri;
  await mongoose.connect(uri);

  // Importar app después de conectar BD
  const module = await import("../../server.js");
  app = module.default;

  // Inyectar usuario autenticado
  app.use((req, res, next) => {
    req.kauth = {
      grant: {
        access_token: { content: mockAdminUser }
      }
    };
    next();
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await clearOrder(null);
});

// ─────────────────────────────────────────────
// HELPER: importa el service dinámicamente
// garantiza que usa la BD correcta
// ─────────────────────────────────────────────
const getOrderService = async () => {
  const { orderService } = await import("../../services/config.js");
  return orderService;
};

// ─────────────────────────────────────────────
// HELPER: crea un usuario falso válido
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

  let orderService;

  beforeEach(async () => {
    orderService = await getOrderService();
    orderService.reservationDAO.getByEmail = jest.fn().mockResolvedValue(createFakeUser());
  });

  // Caso exitoso: orden creada correctamente
  it("debe retornar 201 con la orden creada", async () => {

    const { restaurantId, availableProductId } = await seedOrder(null);

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

    const { restaurantId } = await seedOrder(null);

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

    const { restaurantId, availableProductId } = await seedOrder(null);

    // Sobreescribimos para este test
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

  let orderService;

  beforeEach(async () => {
    orderService = await getOrderService();
    orderService.reservationDAO.getByEmail = jest.fn().mockResolvedValue(createFakeUser());
  });

  // Caso exitoso: cliente ve su propia orden
  it("debe retornar 200 con la orden cuando el cliente es el dueño", async () => {

    const { restaurantId, availableProductId } = await seedOrder(null);

    // Creamos la orden primero
    const createResponse = await request(app)
      .post("/api/orders")
      .send({
        restaurant_id: restaurantId,
        items: [{ product_id: availableProductId, quantity: 1 }]
      });

    expect(createResponse.status).toBe(201);

    const orderId = createResponse.body.order?._id || createResponse.body.order?.id;

    // Mockeamos con el user_id de la orden creada
    orderService.reservationDAO.getByEmail = jest.fn().mockResolvedValue({
      _id: createResponse.body.order.user_id,
      id: createResponse.body.order.user_id,
      email: "carlos.mora@lasazontica.com"
    });

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