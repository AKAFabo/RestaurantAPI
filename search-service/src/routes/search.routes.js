import express from "express";
import {reindex,searchProducts,searchByCategory} from "../controller/search.controller.js";
import os from "os";

const router = express.Router();


router.post("/reindex", reindex);

router.get("/products", searchProducts);
router.get("/products/category/:categoria", searchByCategory);


export default router;