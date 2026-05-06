import pkg from 'pg';
import config from './environment.js';
import mongoose from 'mongoose'

const { Pool } = pkg; // pool de conexiones 

let pool = null;

const connectPostgres = async () => { // conectar a postgres
  try {
    pool = new Pool(config.postgres); // crea el pool segun la configuracion

    await pool.query('SELECT 1'); // verifcia si funciona 

    console.log('Database connected successfully (PostgreSQL)');
  } catch (error) {
    console.error('Failed to connect to PostgreSQL:', error.message);

    if (process.env.NODE_ENV !== "test") { // verifica que no este en entorno de pruebas 
      process.exit(1);
    }
  }
};

const connectMongo = async () => {
    try {
        await mongoose.connect(config.mongo.uri); // se conecta usando el uri de mongo 
        console.log("mongo conectado");
    } catch (error) {
        console.error("error conectando a mongo", error);
        process.exit(1);
    }
};


const connectDatabase = async () => { // decide que base usar 
  const dbType = config.database.type;
  // segun el .env decide a cual conectar la api 
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

  if (!pool) return 'disconnected'; // si existe pool esta conectado 
  return pool.totalCount >= 0 ? 'connected' : 'disconnected';
};

export { pool };
export default connectDatabase;