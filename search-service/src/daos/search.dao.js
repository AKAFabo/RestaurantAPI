import { elasticClient } from "../config/elastic.js";

const INDEX = "products";

class SearchDAO {

  async createIndex() {
    const exists = await elasticClient.indices.exists({ index: INDEX });

    if (!exists) {
      await elasticClient.indices.create({
        index: INDEX,
        body: {
          mappings: {
            properties: {
              name: { type: "text" },
              category: { type: "keyword" },
              description: { type: "text" }
            }
          }
        }
      });

      console.log("Índice creado");
    }
  }

  async indexProduct(product) {
    await elasticClient.index({
      index: INDEX,
      document: product
    });
}

  async deleteIndex() {
    const exists = await elasticClient.indices.exists({ index: INDEX });

    if (exists) {
      await elasticClient.indices.delete({ index: INDEX });
    }
    }

  async searchProducts(query) {
    const result = await elasticClient.search({
      index: INDEX,
      query: {
        multi_match: {
          query: query,
          fields: ["name", "description"],
          fuzziness: "AUTO" // 🔥 clave
        }
      }
  });

  return result.hits.hits.map(hit => hit._source);
}
  async searchByCategory(category) {
    const result = await elasticClient.search({
      index: INDEX,
      query: {
        match: {
          category: category
        }
      }
    });

    return result.hits.hits.map(hit => hit._source);
    }
}

export default new SearchDAO();