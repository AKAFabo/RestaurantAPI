import searchService from "../services/search.service.js";
import os from "os";

// reindezar los datos
export const reindex = async (req, res) => {
  console.log(" reindex desde:", os.hostname());
  
  try {

    const result = await searchService.reindex(); // llama al service para obtener los datos

    res.json(result);

  } catch (error) { // control de errores
    console.error("Error reindexando:", error);

    res.status(500).json({
      error: "Error reindexando"
    });
  }
};
export const searchProducts = async (req, res) => { // buscar productos por el nombre 
  console.log(" searchProducts desde:", os.hostname());
  try {

    const { q } = req.query; // obtiene el producto

    if (!q) { // valida que venga 
      return res.status(400).json({
        error: "Query 'q' es requerida"
      });
    }

    const results = await searchService.searchProducts(q); // llama al service para obtner los datos que coinciden 

    res.json(results);

  } catch (error) {
    console.error("Error en búsqueda:", error);

    res.status(500).json({
      error: "Error buscando productos"
    });
  }
};

// busca productos por categoria 
export const searchByCategory = async (req, res) => {
  console.log("searchByCategory desde:", os.hostname());
  try {

    const { categoria } = req.params; // obtiene la categoria del parametro 

    const results = await searchService.searchByCategory(categoria); // llama al service para obtener los productos con esa categoria 

    res.json(results);

  } catch (error) {// manejo de errores 
    console.error("Error buscando por categoría:", error);

    res.status(500).json({
      error: "Error buscando por categoría"
    });
  }
};