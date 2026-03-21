import express from 'express';
import healthRouter from './health.js';
import restaurantRouter from './restaurantRoutes.js'
import { keycloak } from "../keycloak/keycloak.js";

const router = express.Router();

router.use('/health', healthRouter);


/*  Pública */
router.get("/public", (req, res) => {
  res.json({ message: "Ruta pública" });
});

/*  Protegida */
router.get("/protected", keycloak.protect(), (req, res) => {
  res.json({
    message: "Acceso autorizado 🔐",
    user: req.kauth?.grant?.access_token?.content
  });
});

/*  Solo ADMIN */
router.post("/admin", keycloak.protect("realm:admin"), (req, res) => {
  res.json({ message: "Solo admin " });
});




export default router;