import dotenv from 'dotenv';
import { keycloak } from '../keycloak/keycloak.js';

dotenv.config();

const config = {

  postgres: {
    host: process.env.PG_HOST || 'localhost',
    port: 5432,
    database: process.env.PG_DB,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
  },

  server: {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development'
  },

  keycloak: {
    url: process.env.KEYCLOACK_URL || 'http://localhost:8080',
    realm: process.env.KEYCLOAK_REALM || 'restaurant-realm',
    clientId: process.env.KEYCLOAK_CLIENT_ID || 'restaurant-api',
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
  }


};

export default config;