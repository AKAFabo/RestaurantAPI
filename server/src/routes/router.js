import express from 'express';
import healthRouter from './health.js';
import restaurantRouter from './restaurantRoutes.js'
import { keycloak } from "../keycloak/keycloak.js";
import{getMenuById} from "../controllers/menuController.js"
import {updateMenubyId } from  "../controllers/menuController.js"
import {deletemenu } from  "../controllers/menuController.js"
import {createreservaion } from  "../controllers/reservascontroller.js"
import {deletereservation } from  "../controllers/reservascontroller.js"
import { createOrder } from "../controllers/orderController.js";
import { getOrderById } from "../controllers/orderController.js";
const router = express.Router();

router.use('/health', healthRouter);


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

router.get("/menus/:id", keycloak.protect(),getMenuById) ; // informacion de menu especifico para usuarios autenticados

router.put("menus/:id",keycloak.protect("realm:admin"),updateMenubyId); // actualizar un menu solo el admin

router.delete("menus/id:",keycloak.protect("realm:admin"),deletemenu); //

router.post("/reservations",keycloak.protect("realm:client"),createreservaion);
router.delete("/reservation:id",keycloak.protect("realm:client"),deletereservation);
//  Solo clientes
router.post( "/orders", keycloak.protect("realm:cliente"),createOrder);
//cliente o admin
router.get( "/orders/:id",keycloak.protect("realm:cliente or realm:admin"),getOrderById);


export default router;