
import mongoose from "mongoose";

export const seedOrder = async (pool = null) => {

  const dbType = process.env.DB_TYPE || "postgres";

  if (dbType === "mongo") {

    const { default: User } = await import("../../../models/user.Model.js");
    const { default: Restaurant } = await import("../../../models/restaurant.model.js");
    const { default: Menu } = await import("../../../models/menu.Model.js");

    // Crear usuario cliente
    const user = await User.create({
    name: "Carlos Mora",
    email: "carlos.mora@lasazontica.com",
    password_hash: "hashed_pw",
    role_id: new mongoose.Types.ObjectId()
    });

    // Crear restaurante con mesas
    const restaurant = await Restaurant.create({
      name: "La Sazón Tica",
      address: "Avenida Central, San José, Costa Rica",
      phone: "2222-3333",
      admin_id: new mongoose.Types.ObjectId(),
      tables: [
        { table_number: 1, capacity: 2 },
        { table_number: 2, capacity: 4 }
      ]
    });

    // Crear menú con productos disponibles
    const menu = await Menu.create({
      restaurant_id: restaurant._id,
      name: "Menú Almuerzo Costarricense",
      products: [
        {
          name: "Casado con Pollo",
          description: "Arroz, frijoles negros, ensalada fresca y pollo asado al carbón",
          category: "Comida Típica",
          price: 4500,
          available: true
        },
        {
          name: "Fresco de Cas",
          description: "Bebida natural de cas con azúcar, agua y hielo",
          category: "Bebidas",
          price: 1200,
          available: true
        },
        {
          name: "Tamal de Elote",
          description: "Tamal dulce de elote tierno envuelto en hoja natural",
          category: "Postres",
          price: 1500,
          available: false // producto no disponible para probar ese caso
        }
      ]
    });

    const availableProduct = menu.products[0]; // Casado con Pollo
    const unavailableProduct = menu.products[2]; // Tamal de Elote

    return {
      user,
      restaurant,
      menu,
      availableProduct,
      unavailableProduct,
      userId: user._id.toString(),
      restaurantId: restaurant._id.toString(),
      availableProductId: availableProduct._id.toString(),
      unavailableProductId: unavailableProduct._id.toString()
    };

  } else {

    // PostgreSQL - inserta en tablas separadas
    await pool.query(`INSERT INTO roles (id, name) VALUES (1, 'CLIENT'), (2, 'ADMIN')`);

    // Insertar usuario cliente
    const userResult = await pool.query(`
      INSERT INTO users (name, email, password_hash, role_id)
      VALUES ('Carlos Mora', 'carlos.mora@lasazontica.com', 'hashed_pw', 1)
      RETURNING id
    `);
    const userId = userResult.rows[0].id;

    // Insertar admin para el restaurante
    const adminResult = await pool.query(`
      INSERT INTO users (name, email, password_hash, role_id)
      VALUES ('Carlos Vindas', 'carlos.vindas@lasazontica.com', 'hashed_pw', 2)
      RETURNING id
    `);
    const adminId = adminResult.rows[0].id;

    // Insertar restaurante
    const restaurantResult = await pool.query(`
      INSERT INTO restaurants (name, address, phone, admin_id)
      VALUES ('La Sazón Tica', 'Avenida Central, San José, Costa Rica', '2222-3333', $1)
      RETURNING id
    `, [adminId]);
    const restaurantId = restaurantResult.rows[0].id;

    // Insertar menú
    const menuResult = await pool.query(`
      INSERT INTO menus (restaurant_id, name)
      VALUES ($1, 'Menú Almuerzo Costarricense')
      RETURNING id
    `, [restaurantId]);
    const menuId = menuResult.rows[0].id;

    // Insertar productos
    const productsResult = await pool.query(`
      INSERT INTO products (menu_id, name, description, category, price, available)
      VALUES
      ($1, 'Casado con Pollo', 'Arroz, frijoles negros, ensalada fresca y pollo asado al carbón', 'Comida Típica', 4500, true),
      ($1, 'Fresco de Cas', 'Bebida natural de cas con azúcar, agua y hielo', 'Bebidas', 1200, true),
      ($1, 'Tamal de Elote', 'Tamal dulce de elote tierno envuelto en hoja natural', 'Postres', 1500, false)
      RETURNING id, available
    `, [menuId]);

    const availableProductId = productsResult.rows[0].id;
    const unavailableProductId = productsResult.rows[2].id;

    return {
      userId,
      restaurantId,
      menuId,
      availableProductId,
      unavailableProductId
    };
  }
};

export const clearOrder = async (pool = null) => {

  const dbType = process.env.DB_TYPE || "postgres";

  if (dbType === "mongo") {
    const { default: Order } = await import("../../../models/order.Model.js");
    const { default: Menu } = await import("../../../models/menu.Model.js");
    const { default: Restaurant } = await import("../../../models/restaurant.model.js");
    const { default: User } = await import("../../../models/user.Model.js");
    await Order.deleteMany({});
    await Menu.deleteMany({});
    await Restaurant.deleteMany({});
    await User.deleteMany({});
  } else {
    await pool.query(`DELETE FROM order_items`);
    await pool.query(`DELETE FROM orders`);
    await pool.query(`DELETE FROM products`);
    await pool.query(`DELETE FROM menus`);
    await pool.query(`DELETE FROM restaurants`);
    await pool.query(`DELETE FROM users`);
    await pool.query(`DELETE FROM roles`);
  }
};