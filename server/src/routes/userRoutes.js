import express from 'express';
import userController from '../controllers/userController.js';
import { keycloak } from "../keycloak/keycloak.js";
import { cache } from '../middlewares/cache.js';

const router = express.Router();


router.get('/users', cache("users", 120), userController.getUsers);
router.post('/register', userController.registerUser);
router.post('/login', userController.authUser);

router.get(
  '/me',
  keycloak.protect(),
  cache("me", 60),
  userController.getMe
);


router.put( //No cacheado
  '/users/:id',
  keycloak.protect('realm:client'),
  userController.updateUser
);

router.delete( //No cacheado
  '/users/:id',
  keycloak.protect('realm:client'),
  userController.deleteUser
);
router.post(
  '/users/:id/location',
 
  userController.saveLocation
);
router.get(
  '/users/:id/location',

  userController.getLocation
);

export default router;