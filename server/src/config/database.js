import pkg from 'pg';
import config from './environment.js';

const { Pool } = pkg;

let pool = null;

const connectPostgres = async () => {
  try {
    pool = new Pool(config.postgres);

    await pool.query('SELECT 1');

    console.log('Database connected successfully (PostgreSQL)');
  } catch (error) {
    console.error('Failed to connect to PostgreSQL:', error.message);

    if (process.env.NODE_ENV !== "test") {
      process.exit(1);
    }
  }
};

const connectMongo = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("mongo conectado");
    } catch (error) {
        console.error("error conectando a mongo", error);
        process.exit(1);
    }
};


const connectDatabase = async () => {
  const dbType = config.database.type;

  if (dbType === "mongo") {
    console.log("Usando MongoDB...");
    await connectMongo();   // mongo 
  } else {
    console.log("Usando PostgreSQL...");
    await connectPostgres();  
  }
};

export const getDatabaseStatus = () => {
  if (process.env.DB === "mongo") {
    return 'connected'; 
  }

  if (!pool) return 'disconnected';
  return pool.totalCount >= 0 ? 'connected' : 'disconnected';
};

export { pool };
export default connectDatabase;