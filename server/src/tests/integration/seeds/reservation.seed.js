// reservation.seed.js
// Datos de prueba realistas generados con LLM para pruebas de integración de reservaciones
// Detecta el motor activo y usa la estructura correcta

import mongoose from "mongoose";

export const seedReservation = async (pool = null) => {

  const dbType = process.env.DB_TYPE || "postgres";

  if (dbType === "mongo") {

    const { default: User } = await import("../../../models/user.Model.js");
    const { default: Restaurant } = await import("../../../models/restaurant.model.js");

    // Crear usuario cliente
    const user = await User.create({
      name: "Carlos Mora",
      email: "carlos.mora@lasazontica.com",
      password_hash: "hashed_pw",
      role_id: new mongoose.Types.ObjectId()
    });

    // Crear restaurante con mesas embebidas
    const restaurant = await Restaurant.create({
      name: "La Sazón Tica",
      address: "Avenida Central, San José, Costa Rica",
      phone: "2222-3333",
      admin_id: new mongoose.Types.ObjectId(),
      tables: [
        { table_number: 1, capacity: 2 },
        { table_number: 2, capacity: 4 },
        { table_number: 3, capacity: 6 }
      ]
    });

    const table = restaurant.tables[0];

    return {
      user,
      restaurant,
      table,
      userId: user._id.toString(),
      restaurantId: restaurant._id.toString(),
      tableId: table._id.toString(),
      userEmail: user.email
    };

  } else {

    // PostgreSQL
    await pool.query(`INSERT INTO roles (id, name) VALUES (1, 'CLIENT'), (2, 'ADMIN')`);

    const userResult = await pool.query(`
      INSERT INTO users (name, email, password_hash, role_id)
      VALUES ('Carlos Mora', 'carlos.mora@lasazontica.com', 'hashed_pw', 1)
      RETURNING id, email
    `);
    const userId = userResult.rows[0].id;
    const userEmail = userResult.rows[0].email;

    const adminResult = await pool.query(`
      INSERT INTO users (name, email, password_hash, role_id)
      VALUES ('Carlos Vindas', 'carlos.vindas@lasazontica.com', 'hashed_pw', 2)
      RETURNING id
    `);
    const adminId = adminResult.rows[0].id;

    const restaurantResult = await pool.query(`
      INSERT INTO restaurants (name, address, phone, admin_id)
      VALUES ('La Sazón Tica', 'Avenida Central, San José, Costa Rica', '2222-3333', $1)
      RETURNING id
    `, [adminId]);
    const restaurantId = restaurantResult.rows[0].id;

    const tableResult = await pool.query(`
      INSERT INTO tables (restaurant_id, table_number, capacity)
      VALUES ($1, 1, 4)
      RETURNING id
    `, [restaurantId]);
    const tableId = tableResult.rows[0].id;

    return {
      userId,
      restaurantId,
      tableId,
      userEmail
    };
  }
};

export const clearReservation = async (pool = null) => {

  const dbType = process.env.DB_TYPE || "postgres";

  if (dbType === "mongo") {
    const { default: Reservation } = await import("../../../models/reservations.Model.js");
    const { default: Restaurant } = await import("../../../models/restaurant.model.js");
    const { default: User } = await import("../../../models/user.Model.js");
    await Reservation.deleteMany({});
    await Restaurant.deleteMany({});
    await User.deleteMany({});
  } else {
    await pool.query(`DELETE FROM reservations`);
    await pool.query(`DELETE FROM tables`);
    await pool.query(`DELETE FROM restaurants`);
    await pool.query(`DELETE FROM users`);
    await pool.query(`DELETE FROM roles`);
  }
};