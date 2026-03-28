import pkg from 'pg';
import config from './environment.js';

const { Pool } = pkg;

let pool = null;

const connectDatabase = async () => {

  try {
    pool = new Pool(config.postgres);

    await pool.query('SELECT 1');

    console.log('Database connected successfully (PostgreSQL)');

  } catch (error) {
    console.error('Failed to connect to database:', error.message);
    //  NO matar Jest
    if (process.env.NODE_ENV !== "test") {
      process.exit(1);
    }
  }
};

export const getDatabaseStatus = () => {
  if (!pool) return 'disconnected';

  return pool.totalCount >= 0 ? 'connected' : 'disconnected';
};

export { pool };
export default connectDatabase;