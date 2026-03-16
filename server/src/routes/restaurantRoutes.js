import express from "express";
import { keycloak } from "../keycloak/keycloak.js";

const router = express.Router();

// ruta pública
router.get("/", (req, res) => {
  res.json({ message: "Lista de restaurantes" });
});

// ruta protegida (requiere login)
router.get("/private", keycloak.protect(), (req, res) => {
  res.json({ message: "Solo usuarios autenticados" });
});

// ruta solo para admin
router.post("/", keycloak.protect("realm:admin"), (req, res) => {
  res.json({ message: "Restaurante creado (solo admin)" });
});

export default router;