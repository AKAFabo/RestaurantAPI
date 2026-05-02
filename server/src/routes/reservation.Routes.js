import express from "express";
import { keycloak } from "../keycloak/keycloak.js";
import { createReservation, deleteReservation } from "../controllers/reservascontroller.js";

const router = express.Router(); 

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

router.post("/", keycloak.protect("realm:client"), createReservation); 

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

router.delete("/:id", keycloak.protect("realm:client"), deleteReservation);
export default router;