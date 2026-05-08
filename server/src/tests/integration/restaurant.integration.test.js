process.env.DB = "mongo";
process.env.DB_TYPE = "mongo";

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { seedRestaurant, clearRestaurant } from "./seeds/restaurant.seed.js";
import { mockAdminUser } from "./helpers/mockKeycloak.js";

const dbType = "mongo";
let app;
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGO_URI = uri;
  await mongoose.connect(uri);

  jest.mock("../../keycloak/keycloak.js", () => {
    const session = require("express-session");
    return {
      keycloak: {
        middleware: () => (req, res, next) => next(),
        protect: () => (req, res, next) => next()
      },
      memoryStore: new session.MemoryStore()
    };
  });

  jest.mock("../../config/redis.js", () => ({
    default: {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(null),
      keys: jest.fn().mockResolvedValue([]),
      connect: jest.fn().mockResolvedValue(null),
      on: jest.fn()
    }
  }));

  jest.mock("../../middlewares/cache.js", () => ({
    cache: () => (req, res, next) => next()
  }));

  jest.mock("../../middlewares/cacheHelper.js", () => ({
    invalidateMenusCache: jest.fn().mockResolvedValue(null),
    invalidateUsersCache: jest.fn().mockResolvedValue(null),
    invalidateUserCache: jest.fn().mockResolvedValue(null),
    invalidateRestaurantsCache: jest.fn().mockResolvedValue(null),
    invalidateOrdersCache: jest.fn().mockResolvedValue(null),
  }));

  jest.mock("../../config/database.js", () => ({
    __esModule: true,
    default: jest.fn().mockResolvedValue(null),
    pool: {
      query: jest.fn().mockResolvedValue({ rows: [] }),
      connect: jest.fn().mockResolvedValue({
        query: jest.fn().mockResolvedValue({ rows: [] }),
        release: jest.fn(),
      })
    },
    getDatabaseStatus: jest.fn().mockReturnValue("connected")
  }));

  const module = await import("../../server.js");
  app = module.default;

  app.use((req, res, next) => {
    req.kauth = {
      grant: {
        access_token: { content: mockAdminUser }
      }
    };
    next();
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await clearRestaurant(null);
});

describe(`Restaurant Integration Tests [${dbType}]`, () => {

  describe("POST /api/restaurants/r", () => {
    it("debe crear un nuevo restaurante correctamente", async () => {
      const { userId } = await import("./seeds/user.seed.js").then(m => m.seedUser(null));
      
      const restaurantData = {
        name: "Restaurante de Prueba",
        address: "Calle Falsa 123",
        phone: "555-1234",
        admin_id: userId
      };

      const response = await request(app)
        .post("/api/restaurants/r")
        .send(restaurantData);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(restaurantData.name);
    });
  });

  describe("GET /api/restaurants/r", () => {
    it("debe retornar la lista de restaurantes", async () => {
      await seedRestaurant(null);

      const response = await request(app)
        .get("/api/restaurants/r");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("POST /api/restaurants/r/:restaurantId/menus", () => {
    it("debe crear un menú para un restaurante", async () => {
      const { restaurantId } = await seedRestaurant(null);
      const menuData = { name: "Menú Ejecutivo" };

      const response = await request(app)
        .post(`/api/restaurants/r/${restaurantId}/menus`)
        .send(menuData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Menu creado");
      expect(response.body.menu.name).toBe(menuData.name);
    });
  });
});
