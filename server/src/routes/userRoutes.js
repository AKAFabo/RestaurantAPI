import express from 'express';
import userController from '../controllers/userController.js';

const router = express.Router();

router.get('/users', userController.getUsers);
router.post('/register', userController.registerUser);
router.post('/auth', userController.authUser);

export default router;