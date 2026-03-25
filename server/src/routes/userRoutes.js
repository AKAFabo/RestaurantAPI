import express from 'express';
import userController from '../controllers/userController.js';
import { keycloak } from "../keycloak/keycloak.js";

const router = express.Router();

router.get('/users', userController.getUsers);
router.post('/register', userController.registerUser);
router.post('/login', userController.authUser);
router.get('/me', keycloak.protect('realm:client'), userController.getMe);

export default router;