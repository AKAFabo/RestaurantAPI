import express from "express";
import driverController from "../controllers/driverController.js";
import { keycloak } from "../keycloak/keycloak.js";

const router = express.Router();

router.post(
    "/",
   
    driverController.createDriver
);
router.get(
    "/",
    
    driverController.getDrivers
);
router.get(
    "/assignments/:orderId",
    
    driverController.getAssignmentByOrderId
);
router.get(
    "/routes",
  
    driverController.getRoutes
);

export default router;