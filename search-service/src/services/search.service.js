import axios from "axios"; // hacer peticiones 
import searchDAO from "../daos/search.dao.js";

class SearchService {

 async reindex() {

    //  borrar índice antes
    await searchDAO.deleteIndex();
    await searchDAO.createIndex(); // crea otra vez el indice 

    const response = await axios.get(`${process.env.API_URL}/products`); // llama a la api y trae todos los productos del endpoint 
    const products = response.data; // deja solo los produsctos 

    for (const product of products) { // recorre todos los productos 
        await searchDAO.indexProduct({ // se insertan en el indice 
        name: product.name,
        description: product.description || "Producto sin descripción",
        category: product.category
        });
    }

    return { message: "Reindexación completa" };
    }
    async searchProducts(q) { // recibe el producto y llama al dao 
        return await searchDAO.searchProducts(q);
    }

    async searchByCategory(category) { // recibe la categoria y llama al dao 
        return await searchDAO.searchByCategory(category);
    }
}

export default new SearchService();