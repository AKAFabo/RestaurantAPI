import express from 'express';
import { keycloak } from "../keycloak/keycloak.js";
import{getMenuById} from "../controllers/menuController.js"
import{getAllProducts} from "../controllers/menuController.js"
import {updateMenubyId } from  "../controllers/menuController.js"
import {deleteMenu } from  "../controllers/menuController.js"
import { cache } from "../middlewares/cache.js"

const router = express.Router();

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

router.get("/:id", cache("menu", 120), keycloak.protect(), getMenuById);

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

router.put("/:id", keycloak.protect("realm:admin"), updateMenubyId);

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

router.delete("/:id", keycloak.protect("realm:admin"), deleteMenu);
router.get("/products", cache("products", 120), getAllProducts); 
export default router; 