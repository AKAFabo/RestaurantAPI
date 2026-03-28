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
                realm_access: { roles: ["client"] }
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

// MOCK KEYCLOAK SERVICE (evitar llamadas reales a Keycloak)
jest.mock("../../services/keycloakService.js", () => ({
  __esModule: true,
  createKeycloakUser: jest.fn().mockResolvedValue(),
  updateKeycloakUser: jest.fn().mockResolvedValue(),
  deleteKeycloakUser: jest.fn().mockResolvedValue()
}));


// ==========================
// FUNCIONES DE TEST
// ==========================

function testGetUsers() {
  describe("GET /auth/users", () => {

    it("debe devolver la lista de usuarios", async () => {
      const res = await request(app)
        .get("/api/auth/users");

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

  });
}

function testRegisterUser() {
  describe("POST /auth/register", () => {

    it("debe registrar un usuario correctamente", async () => {
      const newEmail = `register_${Date.now()}@test.com`;

      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: newEmail,
          name: "Nuevo Usuario",
          password: "password123"
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.email).toBe(newEmail);
      expect(res.body.name).toBe("Nuevo Usuario");

      // guardar para cleanup
      global.testData.registeredUserId = res.body.id;
    });

    it("debe devolver 400 si faltan datos", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "solo@email.com" });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Email, name and password are required");
    });

  });
}

function testGetMe() {
  describe("GET /auth/me", () => {

    it("debe devolver la info del usuario autenticado", async () => {
      const res = await request(app)
        .get("/api/auth/me");

      expect(res.statusCode).toBe(200);
      expect(res.body.email).toBe(global.testData.email);
      expect(res.body.name).toBeDefined();
      expect(res.body.id).toBeDefined();
    });

  });
}

function testUpdateUser() {
  describe("PUT /auth/users/:id", () => {

    it("debe actualizar un usuario correctamente", async () => {
      const updatedEmail = `updated_${Date.now()}@test.com`;

      const res = await request(app)
        .put(`/api/auth/users/${global.testData.userId}`)
        .send({
          email: updatedEmail,
          name: "Usuario Actualizado",
          password: "newpassword123"
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe("Usuario Actualizado");

      // actualizar email en testData para que getMe siga funcionando
      global.testData.updatedEmail = updatedEmail;
    });

    it("debe devolver 400 si faltan datos", async () => {
      const res = await request(app)
        .put(`/api/auth/users/${global.testData.userId}`)
        .send({ email: "solo@email.com" });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Email, name and password are required");
    });

    it("debe devolver 404 si el usuario no existe", async () => {
      const res = await request(app)
        .put("/api/auth/users/99999")
        .send({
          email: "x@test.com",
          name: "X",
          password: "x123"
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("User not found");
    });

  });
}

function testDeleteUser() {
  describe("DELETE /auth/users/:id", () => {

    it("debe devolver 404 si el usuario no existe", async () => {
      const res = await request(app)
        .delete("/api/auth/users/99999");

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("User not found");
    });

    it("debe eliminar un usuario correctamente", async () => {
      // eliminar el usuario registrado en testRegisterUser
      if (!global.testData.registeredUserId) return;

      const res = await request(app)
        .delete(`/api/auth/users/${global.testData.registeredUserId}`);

      expect(res.statusCode).toBe(204);

      global.testData.registeredUserId = null; // ya fue eliminado
    });

  });
}


// ==========================
// TEST PRINCIPAL
// ==========================

describe("USERS INTEGRATION", () => {

  beforeAll(async () => {
    await connectDatabase();

    const email = `user_int_${Date.now()}@test.com`;
    const roleName = `CLIENT_USER_${Date.now()}`;

    // ROLE
    const roleRes = await pool.query(`
      INSERT INTO roles (name)
      VALUES ($1)
      RETURNING id
    `, [roleName]);
    const roleId = roleRes.rows[0].id;

    // USER
    const userRes = await pool.query(`
      INSERT INTO users (name, email, password_hash, role_id)
      VALUES ('User Integration Test', $1, 'hash', $2)
      RETURNING id
    `, [email, roleId]);
    const userId = userRes.rows[0].id;

    global.testData = {
      email,
      roleId,
      userId,
      registeredUserId: null,
      updatedEmail: null
    };
  });

  // ejecutar tests en orden
  testGetUsers();
  testRegisterUser();
  testGetMe();
  testUpdateUser();
  testDeleteUser();

  // LIMPIEZA
  afterAll(async () => {

    // borrar usuario registrado en test (si no fue eliminado por deleteUser)
    if (global.testData.registeredUserId) {
      await pool.query(`
        DELETE FROM users WHERE id = $1
      `, [global.testData.registeredUserId]);
    }

    // borrar usuario base
    await pool.query(`
      DELETE FROM users WHERE id = $1
    `, [global.testData.userId]);

    await pool.query(`
      DELETE FROM roles WHERE id = $1
    `, [global.testData.roleId]);

    await pool.end();
  });

});
