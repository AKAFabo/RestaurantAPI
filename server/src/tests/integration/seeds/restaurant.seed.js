import mongoose from "mongoose";

export const seedRestaurant = async (pool = null, options = {}) => {
  const dbType = process.env.DB_TYPE || "postgres";
  const email = options.email || "carlos.vindas@lasazontica.com";
  const restaurantName = options.name || "La Sazón Tica";
  const address = options.address || "Avenida Central, San José, Costa Rica";
  const phone = options.phone || "2222-3333";

  if (dbType === "mongo") {
    const { default: User } = await import("../../../models/user.Model.js");
    const { default: Restaurant } = await import("../../../models/restaurant.model.js");

    const user = await User.create({
      name: "Admin Restaurant Test",
      email,
      password_hash: "hashed_pw",
      role_id: new mongoose.Types.ObjectId()
    });

    const restaurant = await Restaurant.create({
      name: restaurantName,
      address,
      phone,
      admin_id: user._id,
      tables: [
        { table_number: 1, capacity: 2 },
        { table_number: 2, capacity: 4 }
      ]
    });

    return {
      user,
      restaurant,
      userId: user._id.toString(),
      restaurantId: restaurant._id.toString()
    };
  }

  await pool.query(`INSERT INTO roles (id, name) VALUES (1, 'CLIENT'), (2, 'ADMIN')`);

  const userResult = await pool.query(
    `INSERT INTO users (name, email, password_hash, role_id)
     VALUES ('Admin Restaurant Test', $1, 'hashed_pw', 2)
     RETURNING id`,
    [email]
  );

  const adminId = userResult.rows[0].id;

  const restaurantResult = await pool.query(
    `INSERT INTO restaurants (name, address, phone, admin_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [restaurantName, address, phone, adminId]
  );

  return {
    userId: adminId,
    restaurantId: restaurantResult.rows[0].id,
    email
  };
};

export const clearRestaurant = async (pool = null) => {
  const dbType = process.env.DB_TYPE || "postgres";

  if (dbType === "mongo") {
    const { default: Restaurant } = await import("../../../models/restaurant.model.js");
    const { default: User } = await import("../../../models/user.Model.js");
    const { default: Menu } = await import("../../../models/menu.Model.js");

    await Menu.deleteMany({});
    await Restaurant.deleteMany({});
    await User.deleteMany({});
    return;
  }

  await pool.query(`DELETE FROM menus`);
  await pool.query(`DELETE FROM restaurants`);
  await pool.query(`DELETE FROM users`);
  await pool.query(`DELETE FROM roles`);
};
