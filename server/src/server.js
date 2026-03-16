import express from "express";
import session from "express-session";
import cors from "cors";

import { keycloak, memoryStore } from "./keycloak/keycloak.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use(
  session({
    secret: "my-secret",
    resave: false,
    saveUninitialized: true,
    store: memoryStore
  })
);

app.use(keycloak.middleware());
app.use("/restaurants", restaurantRoutes);
app.get("/", (req, res) => {
  res.send("API funcionando");
});

app.get("/private", keycloak.protect(), (req, res) => {
  res.json({ message: "Ruta protegida" });
});

app.get("/admin", keycloak.protect("realm:admin"), (req, res) => {
  res.json({ message: "Solo admins" });
});

app.listen(3000, () => {
  console.log("Servidor corriendo en puerto 3000");
});