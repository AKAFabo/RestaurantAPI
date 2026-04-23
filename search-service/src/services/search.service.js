import axios from "axios";
import searchDAO from "../daos/search.dao.js";

class SearchService {

 async reindex() {

    //  borrar índice antes
    await searchDAO.deleteIndex();
    await searchDAO.createIndex();

    const response = await axios.get(`${process.env.API_URL}/products`);
    const products = response.data;

    for (const product of products) {
        await searchDAO.indexProduct({
        name: product.name,
        description: product.description || "Producto sin descripción",
        category: product.category
        });
    }

    return { message: "Reindexación completa" };
    }
    async searchProducts(q) {
        return await searchDAO.searchProducts(q);
    }

    async searchByCategory(category) {
        return await searchDAO.searchByCategory(category);
    }
}

export default new SearchService();