import request from "supertest";
import app from "../../server.js";
import { pool } from "../../config/database.js";
import connectDatabase from "../../config/database.js";
import dotenv from "dotenv";

dotenv.config({ path: "./src/.env" });

// MOCK KEYCLOAK
jest.mock("../../keycloak/keycloak.js", () => {
  const session = require("express-session");

  return {
    __esModule: true,
    keycloak: {
      protect: () => (req, res, next) => {
        req.kauth = {
          grant: {
            access_token: {
              content: {
                email: global.testData?.email || "fallback@test.com",
                realm_access: { roles: ["admin"] }
              }
            }
          }
        };
        next();
      },
      middleware: () => (req, res, next) => next()
    },
    memoryStore: new session.MemoryStore()
  };
});


// ==========================
// FUNCIONES DE TEST
// ==========================

function testCreateRestaurant() {
  describe("POST /restaurants/r", () => {

    it("debe crear un restaurante correctamente", async () => {
      const res = await request(app)
        .post("/api/restaurants/r")
        .send({
          name: "Restaurante Integration",
          address: "Calle Test 123",
          phone: "88887777"
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe("Restaurante Integration");
      expect(res.body.address).toBe("Calle Test 123");
      expect(res.body.phone).toBe("88887777");

      // guardar para cleanup
      global.testData.createdRestaurantId = res.body.id;
    });

    it("debe devolver 400 si faltan datos", async () => {
      const res = await request(app)
        .post("/api/restaurants/r")
        .send({ name: "Solo nombre" });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Name, address and phone are required");
    });

  });
}

function testGetRestaurants() {
  describe("GET /restaurants/r", () => {

    it("debe devolver la lista de restaurantes", async () => {
      const res = await request(app)
        .get("/api/restaurants/r");

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

  });
}

function testCreateMenu() {
  describe("POST /restaurants/:restaurantId/menus", () => {

    it("debe crear un menu correctamente", async () => {
      const res = await request(app)
        .post(`/api/restaurants/r/${global.testData.restaurantId}/menus`)
        .send({ name: "Menu Integration" });

      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe("Menu Integration");

      global.testData.createdMenuId = res.body.id;
    });

    it("debe devolver 400 si falta el nombre del menu", async () => {
      const res = await request(app)
        .post(`/api/restaurants/r/${global.testData.restaurantId}/menus`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Menu name is required");
    });

  });
}


// ==========================
// TEST PRINCIPAL
// ==========================

describe("RESTAURANTS INTEGRATION", () => {

  beforeAll(async () => {
    await connectDatabase();

    const email = `restaurant_${Date.now()}@test.com`;
    const roleName = `ADMIN_REST_${Date.now()}`;

    // ROLE
    const roleRes = await pool.query(`
      INSERT INTO roles (name)
      VALUES ($1)
      RETURNING id
    `, [roleName]);
    const roleId = roleRes.rows[0].id;

    // USER (admin)
    const userRes = await pool.query(`
      INSERT INTO users (name, email, password_hash, role_id)
      VALUES ('Admin Restaurant Test', $1, 'hash', $2)
      RETURNING id
    `, [email, roleId]);
    const userId = userRes.rows[0].id;

    // RESTAURANT (para test de createMenu)
    const restaurantRes = await pool.query(`
      INSERT INTO restaurants (name, address, admin_id)
      VALUES ('Restaurant Base', 'Address Base', $1)
      RETURNING id
    `, [userId]);
    const restaurantId = restaurantRes.rows[0].id;

    global.testData = {
      email,
      roleId,
      userId,
      restaurantId,
      createdRestaurantId: null,
      createdMenuId: null
    };
  });

  // ejecutar tests
  testCreateRestaurant();
  testGetRestaurants();
  testCreateMenu();

  // LIMPIEZA
  afterAll(async () => {

    // borrar menu creado en test
    if (global.testData.createdMenuId) {
      await pool.query(`
        DELETE FROM menus WHERE id = $1
      `, [global.testData.createdMenuId]);
    }

    // borrar menus del restaurant base
    await pool.query(`
      DELETE FROM menus WHERE restaurant_id = $1
    `, [global.testData.restaurantId]);

    // borrar restaurant creado en test
    if (global.testData.createdRestaurantId) {
      await pool.query(`
        DELETE FROM restaurants WHERE id = $1
      `, [global.testData.createdRestaurantId]);
    }

    // borrar restaurant base
    await pool.query(`
      DELETE FROM restaurants WHERE id = $1
    `, [global.testData.restaurantId]);

    await pool.query(`
      DELETE FROM users WHERE id = $1
    `, [global.testData.userId]);

    await pool.query(`
      DELETE FROM roles WHERE id = $1
    `, [global.testData.roleId]);

    await pool.end();
  });

});
