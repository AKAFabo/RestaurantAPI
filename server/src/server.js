import express from "express";
import session from "express-session";
import cors from "cors";
import config from "./config/environment.js";
import connectDatabase from "./config/database.js";
import routes from './routes/router.js';
import { keycloak, memoryStore } from "./keycloak/keycloak.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./docs/swagger.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use(
  session({
    secret: config.keycloak.clientSecret,
    resave: false,
    saveUninitialized: true,
    store: memoryStore
  })
);

app.use(keycloak.middleware());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec)); // documentacion 
app.use('/api', routes);

const startServer = async () => {
  try {
    await connectDatabase();
    const server = app.listen(config.server.port, () => {
      console.log(`Server running on port ${config.server.port} in ${config.server.nodeEnv} mode`);
      console.log(`Health check: http://localhost:${config.server.port}/api/health`);
    });

    const gracefulShutdown = () => {
      console.log('Received shutdown signal, closing server gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== "test") {
  startServer();
}

export default app;