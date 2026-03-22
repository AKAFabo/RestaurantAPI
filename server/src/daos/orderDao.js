import pool from "../config/database.js";

export const create = async ({ user_id, restaurant_id, reservation_id, items }) => {

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let total = 0;

    // Validar productos y calcular total
    for (const item of items) {

      const productQuery = `
        SELECT id, price, available
        FROM products
        WHERE id = $1
      `;

      const result = await client.query(productQuery, [item.product_id]);

      if (result.rows.length === 0) {
        throw new Error(`Producto ${item.product_id} no existe`);
      }

      const product = result.rows[0];

      if (!product.available) {
        throw new Error(`Producto ${item.product_id} no disponible`);
      }

      // calcular total
      total += product.price * item.quantity;

      // guardar precio real en el item (IMPORTANTE)
      item.price = product.price;
    }

    //  Crear orden
    const orderQuery = `
      INSERT INTO orders
      (user_id, restaurant_id, reservation_id, status, total, created_at)
      VALUES ($1, $2, $3, 'pending', $4, NOW())
      RETURNING *
    `;

    const orderResult = await client.query(orderQuery, [
      user_id,
      restaurant_id,
      reservation_id,
      total
    ]);

    const order = orderResult.rows[0];

    //  Insertar order_items
    for (const item of items) {

      const itemQuery = `
        INSERT INTO order_items
        (order_id, product_id, quantity, price)
        VALUES ($1, $2, $3, $4)
      `;

      await client.query(itemQuery, [
        order.id,
        item.product_id,
        item.quantity,
        item.price
      ]);
    }

    await client.query("COMMIT");

    return order;

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};



export const getById = async (id) => {

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
};