import express from 'express';
import healthRouter from './health.js';
import { keycloak } from "../keycloak/keycloak.js";
import{getMenuById} from "../controllers/menuController.js"
import {updateMenubyId } from  "../controllers/menuController.js"
import {deleteMenu } from  "../controllers/menuController.js"
import {createReservation } from  "../controllers/reservascontroller.js"
import {deleteReservation } from  "../controllers/reservascontroller.js"
import { createOrder } from "../controllers/orderController.js";
import { getOrderById } from "../controllers/orderController.js";
import userRoutes from './userRoutes.js';
import restaurantRoutes from './restaurantRoutes.js';
const router = express.Router();

router.use('/health', healthRouter);
router.use('/auth', userRoutes);
router.use('/restaurants', restaurantRoutes);


// permisos de keycloak

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

/**
 * @swagger
 * /menus/{id}:
 *   get:
 *     summary: Obtener un menú por ID
 *     tags: [Menus]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del menú
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Menú encontrado
 *       404:
 *         description: Menú no encontrado
 */
router.get("/menus/:id", keycloak.protect(), getMenuById);


/**
 * @swagger
 * /menus/{id}:
 *   put:
 *     summary: Actualizar un menú (solo admin)
 *     tags: [Menus]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Menú actualizado
 *       403:
 *         description: No autorizado
 */
router.put("/menus/:id", keycloak.protect("realm:admin"), updateMenubyId);


/**
 * @swagger
 * /menus/{id}:
 *   delete:
 *     summary: Eliminar un menú (solo admin)
 *     tags: [Menus]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Menú eliminado
 *       403:
 *         description: No autorizado
 */
router.delete("/menus/:id", keycloak.protect("realm:admin"), deleteMenu);

/**
 * @swagger
 * /reservations:
 *   post:
 *     summary: Crear una reserva (cliente)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [table_id, reservation_time, party_size]
 *             properties:
 *               table_id:
 *                 type: integer
 *               reservation_time:
 *                 type: string
 *                 example: "2026-03-25T20:00:00"
 *               party_size:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Reserva creada
 *       400:
 *         description: Error de validación
 */
router.post("/reservations", keycloak.protect("realm:client"), createReservation);


/**
 * @swagger
 * /reservations/{id}:
 *   delete:
 *     summary: Cancelar una reserva (cliente)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Reserva cancelada
 *       403:
 *         description: No autorizado
 */
router.delete("/reservations/:id", keycloak.protect("realm:client"), deleteReservation);



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
router.post("/orders", keycloak.protect(), createOrder);


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
router.get("/orders/:id", keycloak.protect(), getOrderById);
export default router;