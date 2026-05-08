process.env.DB = "mongo";
process.env.DB_TYPE = "mongo";

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { seedUser, clearUser } from "./seeds/user.seed.js";
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
  await clearUser(null);
});

describe(`User Integration Tests [${dbType}]`, () => {

  describe("POST /api/auth/register", () => {
    it("debe registrar un nuevo usuario correctamente", async () => {
      const userData = {
        email: "test@example.com",
        name: "Test User",
        password: "password123"
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Usuario registrado");
      expect(response.body.user.email).toBe(userData.email);
    });

    it("debe retornar error si el email ya existe", async () => {
      await seedUser(null, { email: "test@example.com" });

      const userData = {
        email: "test@example.com",
        name: "Test User",
        password: "password123"
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData);

      expect(response.status).toBe(500); // O el error que devuelva tu controlador por duplicado
    });
  });

  describe("GET /api/auth/users", () => {
    it("debe retornar la lista de usuarios", async () => {
      await seedUser(null, { email: "user1@example.com" });
      await seedUser(null, { email: "user2@example.com" });

      const response = await request(app)
        .get("/api/auth/users");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("PUT /api/auth/users/:id", () => {
    it("debe actualizar un usuario correctamente", async () => {
      const { userId } = await seedUser(null);
      const updateData = {
        name: "Updated Name",
        email: "updated@example.com"
      };

      const response = await request(app)
        .put(`/api/auth/users/${userId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Usuario actualizado");
    });
  });

  describe("DELETE /api/auth/users/:id", () => {
    it("debe eliminar un usuario correctamente", async () => {
      const { userId } = await seedUser(null);

      const response = await request(app)
        .delete(`/api/auth/users/${userId}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Usuario eliminado");
    });
  });
});
