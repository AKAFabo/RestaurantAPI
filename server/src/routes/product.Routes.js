import express from 'express';
import { getAllProducts } from "../controllers/menuController.js";
import { cache } from "../middlewares/cache.js"

const router = express.Router();

// Obtener todos los productos
router.get("/", cache("products", 120), getAllProducts);

export default router;