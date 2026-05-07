import express from 'express';
import { createOrder } from "../controllers/orderController.js";
import { getOrderById } from "../controllers/orderController.js"; 
import { keycloak } from "../keycloak/keycloak.js";
import { cache } from "../middlewares/cache.js"
const router = express.Router();
/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Crear un pedido (cliente)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [restaurant_id, items]
 *             properties:
 *               restaurant_id:
 *                 type: integer
 *               reservation_id:
 *                 type: integer
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product_id:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Pedido creado
 */

router.post("/", keycloak.protect(), createOrder);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Obtener un pedido (cliente o admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Pedido encontrado
 *       403:
 *         description: No autorizado
 */

router.get("/:id", keycloak.protect(), cache("orders", 120), getOrderById);
export default router;