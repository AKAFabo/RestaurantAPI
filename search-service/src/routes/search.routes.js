import express from "express";
import {reindex,searchProducts,searchByCategory} from "../controller/search.controller.js";


const router = express.Router();



//router.post("/search/reindex", reindex);


//router.get("/search/products", searchProducts);
//router.get("/search/products/category/:categoria", searchByCategory);

router.post("/reindex", reindex);
router.get("/products", searchProducts);
router.get("/products/category/:categoria", searchByCategory);
export default router;