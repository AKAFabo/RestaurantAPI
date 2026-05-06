import { elasticClient } from "../config/elastic.js"; // conexion con elastic 

const INDEX = "products";

class SearchDAO {

  async createIndex() {
    const exists = await elasticClient.indices.exists({ index: INDEX }); // verifica si el indice ya existe 

    if (!exists) {
      await elasticClient.indices.create({
        index: INDEX,
        body: { // define como se guardan los datos 
          mappings: {
            properties: {
              name: { type: "text" }, // para buscar texto 
              category: { type: "keyword" }, // para coincidencias exactas es para filtros 
              description: { type: "text" }
            }
          }
        }
      });

      console.log("Índice creado");
    }
  }

  async indexProduct(product) {// inserta un producto en elastic search 
    await elasticClient.index({
      index: INDEX,
      document: product // se guarda como documento 
    });
}

  async deleteIndex() {
    const exists = await elasticClient.indices.exists({ index: INDEX }); // verifica si existe 

    if (exists) {
      await elasticClient.indices.delete({ index: INDEX });// si existe lo borra al completo 
    }
    }

  async searchProducts(query) { // hace una busqueda en el indice creado 
    const result = await elasticClient.search({
      index: INDEX,
      query: {
        multi_match: {
          query: query, // busca la palabra 
          fields: ["name", "description"], // busca en los dos campos  
          fuzziness: "AUTO" //  permite encontrar cuando se parecen o estan mal escritas 
        }
      }
  });

  return result.hits.hits.map(hit => hit._source);// deja solo el documento con la informacion necesario 
}
  async searchByCategory(category) {
    const result = await elasticClient.search({
      index: INDEX,
      query: {
        match: {
          category: category // busca la coincidencia en ese campo 
        }
      }
    });

    return result.hits.hits.map(hit => hit._source); // devuelve los datos en un buen formato
    }
}

export default new SearchDAO();