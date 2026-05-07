import express from "express";
import { keycloak } from "../keycloak/keycloak.js";
import restaurantController from "../controllers/restaurantController.js";
import { cache } from "../middlewares/cache.js"

const router = express.Router();


export default router;

router.post('/r', keycloak.protect('realm:admin'), restaurantController.createRestaurant); //No cacheado, bloquear en el service
router.get('/r', keycloak.protect(), cache("restaurants", 120), restaurantController.getRestaurants);
router.post('/r/:restaurantId/menus', keycloak.protect('realm:admin'), restaurantController.createMenu);