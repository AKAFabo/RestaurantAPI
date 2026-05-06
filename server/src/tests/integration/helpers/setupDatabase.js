// setupDatabase.js
// Helper que levanta la BD correcta según DB_TYPE
// Mongo usa mongodb-memory-server, Postgres usa pg-mem

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { newDb } from "pg-mem";

let mongoServer = null;
let pgPool = null;

export const setupDatabase = async () => {

  const dbType = process.env.DB_TYPE || "postgres";

  if (dbType === "mongo") {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    return { type: "mongo" };

  } else {
    const db = newDb();
    const { Pool } = db.adapters.createPg();
    pgPool = new Pool();

    await pgPool.query(`
      CREATE TABLE roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL
      )
    `);

    await pgPool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role_id INTEGER NOT NULL
      )
    `);

    await pgPool.query(`
      CREATE TABLE restaurants (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        address TEXT NOT NULL,
        phone VARCHAR(20),
        admin_id INTEGER NOT NULL
      )
    `);

    await pgPool.query(`
      CREATE TABLE menus (
        id SERIAL PRIMARY KEY,
        restaurant_id INTEGER NOT NULL,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pgPool.query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        menu_id INTEGER NOT NULL,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL,
        price NUMERIC(10,2) NOT NULL,
        available BOOLEAN DEFAULT TRUE
      )
    `);
    await pgPool.query(`
  CREATE TABLE tables (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL,
    table_number INTEGER NOT NULL,
    capacity INTEGER NOT NULL
  )
`);

await pgPool.query(`
  CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    table_id INTEGER NOT NULL,
    reservation_time TIMESTAMP NOT NULL,
    party_size INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

    await pgPool.query(`
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        restaurant_id INTEGER NOT NULL,
        reservation_id INTEGER,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        total NUMERIC(10,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pgPool.query(`
      CREATE TABLE order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price NUMERIC(10,2) NOT NULL
      )
    `);

    

    return { type: "postgres", pool: pgPool };
  }
};

export const teardownDatabase = async () => {

  const dbType = process.env.DB_TYPE || "postgres";

  if (dbType === "mongo") {
    await mongoose.disconnect();
    await mongoServer.stop();
  } else {
    await pgPool.end();
  }
};

export const getPool = () => pgPool;