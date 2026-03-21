import session from "express-session";
import Keycloak from "keycloak-connect";

const memoryStore = new session.MemoryStore();

const keycloak = new Keycloak(
  { store: memoryStore },
  {
    realm: "restaurant-realm",
    "auth-server-url": "http://localhost:8080",
    "ssl-required": "external",
    resource: "restaurant-api",
    "bearer-only": true,
    credentials: {
      secret: "xkHYIFX9ICimg7GmKX7u8bFHDTOJg6KB",
    },
  }
);

export { keycloak, memoryStore };