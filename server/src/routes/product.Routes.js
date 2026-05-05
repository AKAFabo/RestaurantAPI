import express from 'express';
import { getAllProducts } from "../controllers/menuController.js";

const router = express.Router();

// Obtener todos los productos
router.get("/", getAllProducts);

export default router;