import express from 'express';
import healthRouter from './health.js';
import { keycloak } from "../keycloak/keycloak.js";

import menuRoutes from './menu.Routes.js';
import productRoutes from './product.Routes.js';
import orderRoutes from './order.Routes.js';
import reservationRoutes from './reservation.Routes.js';
import userRoutes from './userRoutes.js';
import restaurantRoutes from './restaurantRoutes.js';
import driverRoutes from "./driver.routes.js";
const router = express.Router();

router.use('/health', healthRouter);
router.use('/auth', userRoutes);
router.use('/restaurants', restaurantRoutes);

router.use('/menus', menuRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/reservations', reservationRoutes);
router.use("/drivers", driverRoutes);



// permisos de keycloak testing

/*  Pública */
router.get("/public", (req, res) => {
  res.json({ message: "Ruta pública" });
});

/*  Protegida */
router.get("/protected", keycloak.protect(), (req, res) => {
  res.json({
    message: "Acceso autorizado ",
    user: req.kauth?.grant?.access_token?.content
  });
});

/*  Solo ADMIN */
router.post("/admin", keycloak.protect("realm:admin"), (req, res) => {
  res.json({ message: "Solo admin " });
});


export default router;