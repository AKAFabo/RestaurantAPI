import mongoose from "mongoose";

export const seedUser = async (pool = null, options = {}) => {
  const dbType = process.env.DB_TYPE || "postgres";
  const email = options.email || "carlos.vindas@lasazontica.com";
  const name = options.name || "Carlos Vindas";
  const roleName = options.role || "admin";

  if (dbType === "mongo") {
    const { default: User } = await import("../../../models/user.Model.js");
    const user = await User.create({
      name,
      email,
      password_hash: "hashed_pw",
      role_id: new mongoose.Types.ObjectId()
    });

    return {
      user,
      userId: user._id.toString(),
      email
    };
  }

  await pool.query(`INSERT INTO roles (id, name) VALUES (1, 'CLIENT'), (2, 'ADMIN')`);

  const roleId = roleName.toLowerCase() === "admin" ? 2 : 1;

  const userResult = await pool.query(
    `INSERT INTO users (name, email, password_hash, role_id)
     VALUES ($1, $2, 'hashed_pw', $3)
     RETURNING id`,
    [name, email, roleId]
  );

  return {
    userId: userResult.rows[0].id,
    email
  };
};

export const clearUser = async (pool = null) => {
  const dbType = process.env.DB_TYPE || "postgres";

  if (dbType === "mongo") {
    const { default: User } = await import("../../../models/user.Model.js");
    await User.deleteMany({});
    return;
  }

  await pool.query(`DELETE FROM users`);
  await pool.query(`DELETE FROM roles`);
};
