import searchService from "../services/search.service.js";

export const reindex = async (req, res) => {
  try {

    const result = await searchService.reindex();

    res.json(result);

  } catch (error) {
    console.error("Error reindexando:", error);

    res.status(500).json({
      error: "Error reindexando"
    });
  }
};
export const searchProducts = async (req, res) => {
  try {

    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        error: "Query 'q' es requerida"
      });
    }

    const results = await searchService.searchProducts(q);

    res.json(results);

  } catch (error) {
    console.error("Error en búsqueda:", error);

    res.status(500).json({
      error: "Error buscando productos"
    });
  }
};

export const searchByCategory = async (req, res) => {
  try {

    const { categoria } = req.params;

    const results = await searchService.searchByCategory(categoria);

    res.json(results);

  } catch (error) {
    console.error("Error buscando por categoría:", error);

    res.status(500).json({
      error: "Error buscando por categoría"
    });
  }
};