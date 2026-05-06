// menu.integration.test.js
// Prueba de integración del módulo de menú
// Flujo completo: request HTTP → controller → service → DAO → BD en memoria
// Detecta DB_TYPE para usar Mongo o PostgreSQL automáticamente

// ─────────────────────────────────────────────
// MOCK DE KEYCLOAK - debe ir primero
// ─────────────────────────────────────────────
// DESPUÉS
jest.mock("../../keycloak/keycloak.js", () => {
  const session = require("express-session");
  const memoryStore = new session.MemoryStore();
  return {
    keycloak: {
      middleware: () => (req, res, next) => next(),
      protect: () => (req, res, next) => next()
    },
    memoryStore
  };
});

import request from "supertest";
import mongoose from "mongoose";
import { setupDatabase, teardownDatabase, getPool } from "./helpers/setupDatabase.js";
import { seedMenu, clearMenu } from "./seeds/menu.seed.js";
import { mockAdminUser } from "./helpers/mockKeycloak.js";

const dbType = process.env.DB_TYPE || "postgres";

let app;
let pool;

// ─────────────────────────────────────────────
// SETUP
// ─────────────────────────────────────────────
beforeAll(async () => {

  // Levanta la BD correcta según DB_TYPE
  const db = await setupDatabase();
  pool = db.pool || null;

  // Importa el app después de configurar la BD
  const module = await import("../../server.js");
  app = module.default;

  // Inyecta usuario autenticado en todos los requests
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
  await teardownDatabase();
});

afterEach(async () => {
  await clearMenu(pool);
});

// ─────────────────────────────────────────────
// PRUEBAS: GET /api/menus/:id
// ─────────────────────────────────────────────
describe(`GET /api/menus/:id [${dbType}]`, () => {

  it("debe retornar 200 con el menú y sus productos cuando existe", async () => {

    const { menuId } = await seedMenu(pool);

    const response = await request(app)
      .get(`/api/menus/${menuId}`);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Menú Almuerzo Costarricense");
    expect(response.body.products).toHaveLength(6);
    expect(response.body.products[0].name).toBe("Casado con Pollo");
  });

  it("debe retornar 404 si el menú no existe", async () => {

    // ID que no existe en ninguno de los dos motores
    const fakeId = dbType === "mongo"
      ? new mongoose.Types.ObjectId().toString()
      : 9999;

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

    const { menuId } = await seedMenu(pool);

    const response = await request(app)
      .put(`/api/menus/${menuId}`)
      .send({ name: "Menú Cena Costarricense" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Menu actualizado");
    expect(response.body.menu.name).toBe("Menú Cena Costarricense");
  });

  it("debe retornar 400 si falta el nombre", async () => {

    const { menuId } = await seedMenu(pool);

    const response = await request(app)
      .put(`/api/menus/${menuId}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Nombre requerido");
  });

  it("debe retornar 404 si el menú no existe", async () => {

    const fakeId = dbType === "mongo"
      ? new mongoose.Types.ObjectId().toString()
      : 9999;

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

    const { menuId } = await seedMenu(pool);

    const response = await request(app)
      .delete(`/api/menus/${menuId}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Menú eliminado correctamente");

    // Verifica que el menú realmente ya no existe en la BD
    const check = await request(app)
      .get(`/api/menus/${menuId}`);

    expect(check.status).toBe(404);
  });

  it("debe retornar 404 si el menú no existe", async () => {

    const fakeId = dbType === "mongo"
      ? new mongoose.Types.ObjectId().toString()
      : 9999;

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

    await seedMenu(pool);

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