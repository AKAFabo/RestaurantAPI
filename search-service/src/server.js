import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import searchRoutes from "./routes/search.routes.js";
import searchDAO from "./daos/search.dao.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// rutas
app.use("/", searchRoutes);

app.get("/", (req, res) => {
  res.send("Search service running 🚀");
});

// 🔥 inicializar índice (infraestructura, no negocio)
(async () => {
  try {
    await searchDAO.createIndex();
  } catch (error) {
    console.error("Error creando índice:", error);
  }
})();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Search service running on port ${PORT}`);
});