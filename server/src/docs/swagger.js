import swaggerJsdoc from "swagger-jsdoc";

// configuracion de la pagina de swagger 

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Reserva Inteligente",
      version: "1.0.0",
      description: "Documentación de la API",
    },
    servers: [
      {
        url: "http://localhost:3001/api",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { // para poner el token 
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/routes/*.js"], // en donde se obtienen los endpoints 
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;