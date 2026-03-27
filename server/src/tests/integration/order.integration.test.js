import request from "supertest";
import app from "../../server.js";
import { pool } from "../../config/database.js";
import connectDatabase from "../../config/database.js";
import dotenv from "dotenv";

dotenv.config({ path: "./src/.env" });

jest.mock("../../keycloak/keycloak.js", () => { // mock para simular el keycloak , si no ocupa el token real
  const session = require("express-session");

  return {
    __esModule: true,
    keycloak: {
      protect: () => (req, res, next) => {

        //  usa email dinámico guardado globalmente
        const email = global.testData?.email || "fallback@test.com";

        req.kauth = {
          grant: {
            access_token: {
              content: {
                email: email,
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


// ==========================
// FUNCIONES DE TEST
// ==========================

function testPostOrder() {
  describe("POST /orders", () => { // endpoint que se prueba 

    it("debe crear un pedido correctamente", async () => {
      const res = await request(app)
        .post("/api/orders")
        .send({ // se le envian los datos de prueba 
          restaurant_id: global.testData.restaurantId,
          items: [
            {
              product_id: global.testData.productId,
              quantity: 2
            }
          ]
        });

      expect(res.statusCode).toBe(201); // codigo de exito 
      expect(res.body.message).toBe("Pedido creado");
      expect(res.body.order).toBeDefined();
    });

    it("debe fallar si no hay items", async () => { // provoca el error 
      const res = await request(app)
        .post("/api/orders")
        .send({
          restaurant_id: global.testData.restaurantId,
          items: []
        });

      expect(res.statusCode).toBe(400); // codigo de error 
    });

  });
}

function testGetOrder() {
  describe("GET /orders/:id", () => { // endpoint que se prueba 

    it("debe obtener un pedido correctamente", async () => {
      const res = await request(app)
        .get(`/api/orders/${global.testData.orderId}`); // se envia el id 

      expect(res.statusCode).toBe(200); // codigo de exito 
      expect(res.body.id).toBe(global.testData.orderId);
    });

    it("debe devolver 404 si no existe", async () => {
      const res = await request(app)
        .get("/api/orders/99999"); 

      expect(res.statusCode).toBe(404);// no existe el id 
    });

  });
}


// ==========================
// TEST PRINCIPAL
// ==========================

describe("ORDERS INTEGRATION", () => {

  beforeAll(async () => {
    await connectDatabase();

    //  datos únicos para evitar duplicados
    const email = `integration_${Date.now()}@test.com`;
    const roleName = `CLIENT_${Date.now()}`;

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
      VALUES ('Test User', $1, 'hash', $2)
      RETURNING id
    `, [email, roleId]);
    const userId = userRes.rows[0].id;

    // RESTAURANT
    const restaurantRes = await pool.query(`
      INSERT INTO restaurants (name, address, admin_id)
      VALUES ('Test Restaurant', 'Address', $1)
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

    // PRODUCT
    const productRes = await pool.query(`
      INSERT INTO products (menu_id, name, price, available)
      VALUES ($1, 'Pizza Test', 10.00, true)
      RETURNING id
    `, [menuId]);
    const productId = productRes.rows[0].id;

    // ORDER (para GET)
    const orderRes = await pool.query(`
      INSERT INTO orders (user_id, restaurant_id, status, total)
      VALUES ($1, $2, 'PENDING', 20)
      RETURNING id
    `, [userId, restaurantId]);

    const orderId = orderRes.rows[0].id;

    global.testData = {
      userId,
      restaurantId,
      productId,
      orderId,
      email,
      roleId,
      menuId
    };
  });

  // ejecutar tests
  testPostOrder();
  testGetOrder();

afterAll(async () => {
  // borrar los datos que se insertaron en la prueba 

  //  BORRAR TODOS LOS ORDER_ITEMS del producto creado
  await pool.query(`
    DELETE FROM order_items 
    WHERE product_id = $1
  `, [global.testData.productId]);

  //  BORRAR TODAS LAS ORDENES del usuario de prueba
  await pool.query(`
    DELETE FROM orders 
    WHERE user_id = $1
  `, [global.testData.userId]);

  
  await pool.query(`
    DELETE FROM products WHERE id = $1
  `, [global.testData.productId]);

  await pool.query(`
    DELETE FROM menus WHERE id = $1
  `, [global.testData.menuId]);

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