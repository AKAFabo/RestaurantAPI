
import mongoose from "mongoose";

export const seedMenu = async (pool = null) => {

  const dbType = process.env.DB_TYPE || "postgres";

  if (dbType === "mongo") {
    // Importamos los modelos de Mongo
    const { default: Restaurant } = await import("../../../models/restaurant.model.js");
    const { default: Menu } = await import("../../../models/menu.Model.js");
    console.log("SEED URI:", mongoose.connection.host);
    console.log("SEED DB:", mongoose.connection.name);
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

    // Crear menú con productos embebidos
    const menu = await Menu.create({
      restaurant_id: restaurant._id,
      name: "Menú Almuerzo Costarricense",
      products: [
        {
          name: "Casado con Pollo",
          description: "Arroz, frijoles negros, ensalada fresca, plátano maduro y pollo asado al carbón",
          category: "Comida Típica",
          price: 4500,
          available: true
        },
        {
          name: "Gallo Pinto con Huevos",
          description: "Mezcla tradicional de arroz y frijoles con huevos revueltos y natilla",
          category: "Desayuno",
          price: 2800,
          available: true
        },
        {
          name: "Sopa Negra",
          description: "Caldo espeso de frijoles negros con huevo pochado, cilantro y culantro coyote",
          category: "Sopas",
          price: 3200,
          available: true
        },
        {
          name: "Chifrijo",
          description: "Arroz, frijoles, chicharrón crujiente, pico de gallo y aguacate fresco",
          category: "Bocas",
          price: 3800,
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
          description: "Tamal dulce de elote tierno envuelto en hoja natural, servido con natilla",
          category: "Postres",
          price: 1500,
          available: false
        }
      ]
    });

    return { restaurant, menu, menuId: menu._id.toString() };

  } else {

    // PostgreSQL - inserta en tablas separadas
    await pool.query(`INSERT INTO roles (id, name) VALUES (1, 'CLIENT'), (2, 'ADMIN')`);

    const userResult = await pool.query(`
      INSERT INTO users (name, email, password_hash, role_id)
      VALUES ('Carlos Vindas', 'carlos.vindas@lasazontica.com', 'hashed_pw', 2)
      RETURNING id
    `);
    const adminId = userResult.rows[0].id;

    const restaurantResult = await pool.query(`
      INSERT INTO restaurants (name, address, phone, admin_id)
      VALUES ('La Sazón Tica', 'Avenida Central, San José, Costa Rica', '2222-3333', $1)
      RETURNING id
    `, [adminId]);
    const restaurantId = restaurantResult.rows[0].id;

    const menuResult = await pool.query(`
      INSERT INTO menus (restaurant_id, name)
      VALUES ($1, 'Menú Almuerzo Costarricense')
      RETURNING id
    `, [restaurantId]);
    const menuId = menuResult.rows[0].id;

    await pool.query(`
      INSERT INTO products (menu_id, name, description, category, price, available)
      VALUES
      ($1, 'Casado con Pollo', 'Arroz, frijoles negros, ensalada fresca, plátano maduro y pollo asado al carbón', 'Comida Típica', 4500, true),
      ($1, 'Gallo Pinto con Huevos', 'Mezcla tradicional de arroz y frijoles con huevos revueltos y natilla', 'Desayuno', 2800, true),
      ($1, 'Sopa Negra', 'Caldo espeso de frijoles negros con huevo pochado, cilantro y culantro coyote', 'Sopas', 3200, true),
      ($1, 'Chifrijo', 'Arroz, frijoles, chicharrón crujiente, pico de gallo y aguacate fresco', 'Bocas', 3800, true),
      ($1, 'Fresco de Cas', 'Bebida natural de cas con azúcar, agua y hielo', 'Bebidas', 1200, true),
      ($1, 'Tamal de Elote', 'Tamal dulce de elote tierno envuelto en hoja natural, servido con natilla', 'Postres', 1500, false)
    `, [menuId]);

    return { restaurantId, menuId };
  }
};

export const clearMenu = async (pool = null) => {

  const dbType = process.env.DB_TYPE || "postgres";

  if (dbType === "mongo") {
    const { default: Menu } = await import("../../../models/menu.Model.js");
    const { default: Restaurant } = await import("../../../models/restaurant.model.js");
    await Menu.deleteMany({});
    await Restaurant.deleteMany({});
  } else {
    await pool.query(`DELETE FROM products`);
    await pool.query(`DELETE FROM menus`);
    await pool.query(`DELETE FROM restaurants`);
    await pool.query(`DELETE FROM users`);
    await pool.query(`DELETE FROM roles`);
  }
};