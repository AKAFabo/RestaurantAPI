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
                realm_access: { roles: ["admin"] } //  admin para menus
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
// TESTS
// ==========================

function testGetMenu() {
  describe("GET /menus/:id", () => { // endpoint que se prueba 

    it("debe obtener un menú correctamente", async () => {
      const res = await request(app)
        .get(`/api/menus/${global.testData.menuId}`);
        // verifica que este correcto
      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(global.testData.menuId);
    });
    // se provoca el error para probar 
    it("debe devolver 404 si no existe", async () => {
      const res = await request(app)
        .get("/api/menus/99999");

      expect(res.statusCode).toBe(404);
    });

  });
}

function testUpdateMenu() {
  describe("PUT /menus/:id", () => {

    it("debe actualizar un menú correctamente", async () => {
      const res = await request(app)
        .put(`/api/menus/${global.testData.menuId}`)
        .send({ name: "Menu actualizado" }); // es el caso exitoso 

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Menu actualizado");
      expect(res.body.menu.name).toBe("Menu actualizado");
    });
    // provocar los errores 
    it("debe devolver 400 si falta nombre", async () => {
      const res = await request(app)
        .put(`/api/menus/${global.testData.menuId}`)
        .send({});

      expect(res.statusCode).toBe(400);
    });
    // provoca el otro error 
    it("debe devolver 404 si no existe", async () => {
      const res = await request(app)
        .put("/api/menus/99999")
        .send({ name: "X" });

      expect(res.statusCode).toBe(404);
    });

  });
}

function testDeleteMenu() {
  describe("DELETE /menus/:id", () => { // endpoint de prueba 

    it("debe eliminar un menú correctamente", async () => { // caso de exito donde si existe el id
      const res = await request(app)
        .delete(`/api/menus/${global.testData.menuId}`);

      expect(res.statusCode).toBe(200); // regresa el codigo 200
      expect(res.body.message).toBe("Menú eliminado correctamente");
    });

    it("debe devolver 404 si no existe", async () => {
      const res = await request(app)
        .delete("/api/menus/99999");

      expect(res.statusCode).toBe(404); // devuelve el codigo 
    });

  });
}


// ==========================
// TEST PRINCIPAL
// ==========================

describe("MENUS INTEGRATION", () => {

  beforeAll(async () => { // se ejecuta antes de los tests
    await connectDatabase(); // conecta a la base real
    // esto para que no haya errores con unique en la base 
    const email = `menu_${Date.now()}@test.com`;
    const roleName = `ADMIN_${Date.now()}`;
    // se insertan los datos que se van a usar en las pruebas 
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
      VALUES ('Admin Test', $1, 'hash', $2)
      RETURNING id
    `, [email, roleId]);
    const userId = userRes.rows[0].id;

    // RESTAURANT
    const restaurantRes = await pool.query(`
      INSERT INTO restaurants (name, address, admin_id)
      VALUES ('Restaurant Test', 'Address', $1)
      RETURNING id
    `, [userId]);
    const restaurantId = restaurantRes.rows[0].id;

    // MENU
    const menuRes = await pool.query(`
      INSERT INTO menus (restaurant_id, name)
      VALUES ($1, 'Menu Test')
      RETURNING id
    `, [restaurantId]);
    const menuId = menuRes.rows[0].id;

    global.testData = {
      email,
      roleId,
      userId,
      restaurantId,
      menuId
    };
  });

  // ejecutar tests
  testGetMenu();
  testUpdateMenu();
  testDeleteMenu();

  // 🧹LIMPIEZA S
  afterAll(async () => {

    // se borran los datos que se crearon para no agregar datos invalidos 
    await pool.query(`
      DELETE FROM menus WHERE restaurant_id = $1
    `, [global.testData.restaurantId]);

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