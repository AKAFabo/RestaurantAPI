import session from "express-session";
import Keycloak from "keycloak-connect";

const memoryStore = new session.MemoryStore();

const keycloak = new Keycloak(
  { store: memoryStore },
  {
    realm: "restaurant-realm",
    "auth-server-url": "http://localhost:8080/",
    "ssl-required": "external",
    resource: "restaurant-api",
    credentials: {
      secret: "ZJBJJF8pz2Scn3hiIrVPVVvTSqjo8Y8k"
    },
    "confidential-port": 0
  }
);

export { keycloak, memoryStore };