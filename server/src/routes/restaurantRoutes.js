import express from "express";
import { keycloak } from "../keycloak/keycloak.js";
import restaurantController from "../controllers/restaurantController.js";

const router = express.Router();


export default router;

router.post('/r', keycloak.protect('realm:admin'), restaurantController.createRestaurant);
router.get('/r', keycloak.protect(), restaurantController.getRestaurants);
router.post('/r/:restaurantId/menus', keycloak.protect('realm:admin'), restaurantController.createMenu);