
process.env.DB = "mongo";
process.env.DB_TYPE = "mongo";

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { seedMenu, clearMenu } from "./seeds/menu.seed.js";
import { mockAdminUser } from "./helpers/mockKeycloak.js";

const dbType = "mongo";
let app;
let mongoServer;

beforeAll(async () => {

  // Levantar MongoDB en memoria PRIMERO
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  //  Sobreescribir MONGO_URI para que el DAO use esta BD
  process.env.MONGO_URI = uri;

  //  Conectar mongoose al memory server
  await mongoose.connect(uri);

  // Mockear módulos que no queremos que corran real
  jest.mock("../../keycloak/keycloak.js", () => {
    const session = require("express-session");
    return {
      keycloak: {
        middleware: () => (req, res, next) => next(),
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

  //  Mockear connectDatabase para que NO reconecte
  // Usamos la conexión que ya levantamos arriba
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

  //  Importar el app DESPUÉS de todos los mocks y la BD
  const module = await import("../../server.js");
  app = module.default;

  //  Inyectar usuario autenticado
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
  await clearMenu(null);
});

// ─────────────────────────────────────────────
// PRUEBAS: GET /api/menus/:id
// ─────────────────────────────────────────────
describe(`GET /api/menus/:id [${dbType}]`, () => {

  it("debe retornar 200 con el menú y sus productos cuando existe", async () => {

    const { menuId } = await seedMenu(null);

    const response = await request(app)
      .get(`/api/menus/${menuId}`);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Menú Almuerzo Costarricense");
    expect(response.body.products).toHaveLength(6);
    expect(response.body.products[0].name).toBe("Casado con Pollo");
  });

  it("debe retornar 404 si el menú no existe", async () => {

    const fakeId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .get(`/api/menus/${fakeId}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Menu no encontrado");
  });

});

// ─────────────────────────────────────────────
// PRUEBAS: PUT /api/menus/:id
// ─────────────────────────────────────────────
describe(`PUT /api/menus/:id [${dbType}]`, () => {

  it("debe retornar 200 con el menú actualizado", async () => {

    const { menuId } = await seedMenu(null);

    const response = await request(app)
      .put(`/api/menus/${menuId}`)
      .send({ name: "Menú Cena Costarricense" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Menu actualizado");
    expect(response.body.menu.name).toBe("Menú Cena Costarricense");
  });

  it("debe retornar 400 si falta el nombre", async () => {

    const { menuId } = await seedMenu(null);

    const response = await request(app)
      .put(`/api/menus/${menuId}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Nombre requerido");
  });

  it("debe retornar 404 si el menú no existe", async () => {

    const fakeId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .put(`/api/menus/${fakeId}`)
      .send({ name: "Nuevo nombre" });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Menu no encontrado");
  });

});

// ─────────────────────────────────────────────
// PRUEBAS: DELETE /api/menus/:id
// ─────────────────────────────────────────────
describe(`DELETE /api/menus/:id [${dbType}]`, () => {

  it("debe retornar 200 cuando el menú es eliminado correctamente", async () => {

    const { menuId } = await seedMenu(null);

    const response = await request(app)
      .delete(`/api/menus/${menuId}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Menú eliminado correctamente");

    const check = await request(app)
      .get(`/api/menus/${menuId}`);

    expect(check.status).toBe(404);
  });

  it("debe retornar 404 si el menú no existe", async () => {

    const fakeId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .delete(`/api/menus/${fakeId}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Menú no encontrado");
  });

});

// ─────────────────────────────────────────────
// PRUEBAS: GET /api/products
// ─────────────────────────────────────────────
describe(`GET /api/products [${dbType}]`, () => {

  it("debe retornar 200 con todos los productos", async () => {

    await seedMenu(null);

    const response = await request(app)
      .get("/api/products");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(6);
    expect(response.body[0]).toHaveProperty("name");
    expect(response.body[0]).toHaveProperty("description");
    expect(response.body[0]).toHaveProperty("category");
    expect(response.body[0]).toHaveProperty("price");
  });

  it("debe retornar lista vacía si no hay productos", async () => {

    const response = await request(app)
      .get("/api/products");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

});