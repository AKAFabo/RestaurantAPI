import request from "supertest";
import app from "../../server.js";
import { pool } from "../../config/database.js";
import connectDatabase from "../../config/database.js";
import dotenv from "dotenv";

dotenv.config({ path: "./src/.env" });

//  MOCK KEYCLOAK
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
                email: "test@mail.com",
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

describe("RESERVATIONS INTEGRATION", () => {

  beforeAll(async () => {
    await connectDatabase();

    //  ROLE (único para evitar error duplicate)
    const roleRes = await pool.query(`
      INSERT INTO roles (name)
      VALUES ($1)
      RETURNING id
    `, [`CLIENT_TEST_${Date.now()}`]);

    const roleId = roleRes.rows[0].id;

    //  USER (email EXACTO al mock)
    const userRes = await pool.query(`
      INSERT INTO users (name, email, password_hash, role_id)
      VALUES ('Test User', 'test@mail.com', 'hash', $1)
      RETURNING id
    `, [roleId]);

    const userId = userRes.rows[0].id;

    //  RESTAURANT
    const restaurantRes = await pool.query(`
      INSERT INTO restaurants (name, address, admin_id)
      VALUES ('Test Restaurant', 'Address', $1)
      RETURNING id
    `, [userId]);

    const restaurantId = restaurantRes.rows[0].id;

    // TABLE (MUY IMPORTANTE para que no falle el DAO)
    const tableRes = await pool.query(`
      INSERT INTO tables (restaurant_id, table_number, capacity)
      VALUES ($1, 1, 4)
      RETURNING id
    `, [restaurantId]);

    const tableId = tableRes.rows[0].id;

    global.testData = {
      roleId,
      userId,
      restaurantId,
      tableId,
      reservationId: null
    };
  });

  // ==========================
  //  POST /reservations
  // ==========================
  describe("POST /reservations", () => {

    it("debe crear una reserva correctamente", async () => {
      const res = await request(app)
        .post("/api/reservations")
        .send({
          table_id: global.testData.tableId,
          reservation_time: "2030-01-01 20:00:00",
          party_size: 2
        });

      //  debug útil si falla
      if (res.statusCode !== 201) {
        console.log("ERROR RESPONSE:", res.body);
      }

      expect(res.statusCode).toBe(201);
      expect(res.body.reservation).toBeDefined();

      global.testData.reservationId = res.body.reservation.id;
    });

  });

  // ==========================
  //  DELETE /reservations/:id
  // ==========================
  describe("DELETE /reservations/:id", () => {

    it("debe cancelar una reserva correctamente", async () => {
      const res = await request(app)
        .delete(`/api/reservations/${global.testData.reservationId}`);

      if (res.statusCode !== 200) {
        console.log("DELETE ERROR:", res.body);
      }

      expect(res.statusCode).toBe(200);
    });

  });

  // ==========================
  //  LIMPIEZA SEGURA
  // ==========================
  afterAll(async () => {

    if (global.testData.reservationId) {
      await pool.query(
        "DELETE FROM reservations WHERE id = $1",
        [global.testData.reservationId]
      );
    }

    await pool.query(
      "DELETE FROM tables WHERE id = $1",
      [global.testData.tableId]
    );

    await pool.query(
      "DELETE FROM restaurants WHERE id = $1",
      [global.testData.restaurantId]
    );

    await pool.query(
      "DELETE FROM users WHERE id = $1",
      [global.testData.userId]
    );

    await pool.query(
      "DELETE FROM roles WHERE id = $1",
      [global.testData.roleId]
    );

    await pool.end();
  });

});