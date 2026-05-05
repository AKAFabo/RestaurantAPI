import OrderDAO from "./order.dao.abstract.js";
import { pool } from "../../config/database.js";

class PostgresOrderDAO extends OrderDAO {

  async create({ user_id, restaurant_id, reservation_id, items }) {

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      let total = 0;

      //  validar items
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error("Items inválidos");
      }

      for (const item of items) {

        if (!item.quantity || item.quantity <= 0) {
          throw new Error(`Cantidad inválida para producto ${item.product_id}`);
        }

        const productQuery = `
          SELECT p.id, p.price, p.available, m.restaurant_id
          FROM products p
          JOIN menus m ON p.menu_id = m.id
          WHERE p.id = $1
        `;

        const result = await client.query(productQuery, [item.product_id]);

        if (result.rows.length === 0) {
          throw new Error(`Producto ${item.product_id} no existe`);
        }

        const product = result.rows[0];

        if (!product.available) {
          throw new Error(`Producto ${item.product_id} no disponible`);
        }

        //  validar que pertenece al restaurante
        if (product.restaurant_id !== restaurant_id) {
          throw new Error(`Producto ${item.product_id} no pertenece al restaurante`);
        }

        total += product.price * item.quantity;

        item.price = product.price;
      }

      //  
      const orderResult = await client.query(
        `
        INSERT INTO orders
        (user_id, restaurant_id, reservation_id, status, total)
        VALUES ($1, $2, $3, 'PENDING', $4)
        RETURNING *
        `,
        [user_id, restaurant_id, reservation_id, total]
      );

      const order = orderResult.rows[0];

      // insertar items
      for (const item of items) {

        await client.query(
          `
          INSERT INTO order_items
          (order_id, product_id, quantity, price)
          VALUES ($1, $2, $3, $4)
          `,
          [order.id, item.product_id, item.quantity, item.price]
        );
      }

      await client.query("COMMIT");

      return order;

    } catch (error) {
      await client.query("ROLLBACK");
      throw error;

    } finally {
      client.release();
    }
  }


  async getById(id) {

    // Obtener orden
    const orderQuery = `
      SELECT 
        id,
        user_id,
        restaurant_id,
        reservation_id,
        status,
        total,
        created_at
      FROM orders
      WHERE id = $1
    `;

    const orderResult = await pool.query(orderQuery, [id]);

    if (orderResult.rows.length === 0) {
      return null;
    }

    const order = orderResult.rows[0];

    //  Obtener items con info de producto
    const itemsQuery = `
      SELECT 
        oi.id,
        oi.product_id,
        p.name,
        oi.quantity,
        oi.price
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `;

    const itemsResult = await pool.query(itemsQuery, [id]);

    //  Agregar items al pedido
    order.items = itemsResult.rows;

    return order;
  }
  

}

export default new PostgresOrderDAO();
