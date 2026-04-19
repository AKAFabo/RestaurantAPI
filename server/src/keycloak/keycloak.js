import session from "express-session";
import Keycloak from "keycloak-connect";
import 'dotenv/config';

const memoryStore = new session.MemoryStore();

const keycloak = new Keycloak(
  { store: memoryStore },
  {
    realm: process.env.KEYCLOAK_REALM,
    "auth-server-url": process.env.KEYCLOAK_URL,
    "ssl-required": "none",
    resource: process.env.KEYCLOAK_CLIENT_ID,
    "bearer-only": true,
    credentials: {
      secret: process.env.KEYCLOAK_CLIENT_SECRET,
    },
  }
);

export { keycloak, memoryStore };