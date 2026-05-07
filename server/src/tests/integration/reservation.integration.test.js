
process.env.DB = "mongo";
process.env.DB_TYPE = "mongo";


jest.mock("../../keycloak/keycloak.js", () => {
  const session = require("express-session");
  return {
    keycloak: {
      middleware: () => (req, res, next) => {
        req.kauth = {
          grant: {
            access_token: {
              content: {
                email: "carlos.mora@lasazontica.com",
                realm_access: { roles: ["user"] }
              }
            }
          }
        };
        next();
      },
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

import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { seedReservation, clearReservation } from "./seeds/reservation.seed.js";
import { mockAdminUser } from "./helpers/mockKeycloak.js";

const dbType = "mongo";
let app;
let mongoServer;

// ─────────────────────────────────────────────
// SETUP
// ─────────────────────────────────────────────
beforeAll(async () => {

  // Levantar MongoDB en memoria
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGO_URI = uri;
  await mongoose.connect(uri);

  //  Importar app después de conectar BD
  const module = await import("../../server.js");
  app = module.default;

  // Inyectar usuario autenticado
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
  await clearReservation(null);
});

// ─────────────────────────────────────────────
// HELPER: importa el service después de que la BD esté lista
// ─────────────────────────────────────────────
const getReservationService = async () => {
  const { reservationService } = await import("../../services/config.js");
  return reservationService;
};

// ─────────────────────────────────────────────
// HELPER: crea un usuario falso válido
// ─────────────────────────────────────────────
const createFakeUser = (email = "carlos.mora@lasazontica.com") => {
  const fakeId = new mongoose.Types.ObjectId();
  return {
    _id: fakeId,
    id: fakeId.toString(),
    email
  };
};

// ─────────────────────────────────────────────
// PRUEBAS: POST /api/reservations
// ─────────────────────────────────────────────
describe(`POST /api/reservations [${dbType}]`, () => {

  let reservationService;

  beforeEach(async () => {
    reservationService = await getReservationService();
    reservationService.reservationDAO.getByEmail = jest.fn().mockResolvedValue(createFakeUser());
  });

  // Caso exitoso: reserva creada correctamente
  it("debe retornar 201 con la reserva creada", async () => {

    const { tableId } = await seedReservation(null);

    const response = await request(app)
      .post("/api/reservations")
      .send({
        table_id: tableId,
        reservation_time: "2026-06-01T19:00:00",
        party_size: 4
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Reserva creada");
    expect(response.body.reservation).toBeDefined();
  });

  // Error 400: faltan campos requeridos
  it("debe retornar 400 si faltan campos requeridos", async () => {

    const response = await request(app)
      .post("/api/reservations")
      .send({
        table_id: "123"
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("table_id, reservation_time y party_size son requeridos");
  });

  // Error 404: usuario no existe en la BD
  it("debe retornar 404 si el usuario no existe en la BD", async () => {

    const { tableId } = await seedReservation(null);
    reservationService.reservationDAO.getByEmail = jest.fn().mockResolvedValue(null);

    const response = await request(app)
      .post("/api/reservations")
      .send({
        table_id: tableId,
        reservation_time: "2026-06-01T19:00:00",
        party_size: 4
      });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Usuario no existe en la BD");
  });

  // Error 500: mesa no existe
  it("debe retornar 500 si la mesa no existe", async () => {

    const fakeTableId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .post("/api/reservations")
      .send({
        table_id: fakeTableId,
        reservation_time: "2026-06-01T19:00:00",
        party_size: 4
      });

    expect(response.status).toBe(500);
  });

});

// ─────────────────────────────────────────────
// PRUEBAS: DELETE /api/reservations/:id
// ─────────────────────────────────────────────
describe(`DELETE /api/reservations/:id [${dbType}]`, () => {

  let reservationService;

  beforeEach(async () => {
    reservationService = await getReservationService();
    reservationService.reservationDAO.getByEmail = jest.fn().mockResolvedValue(createFakeUser());
  });

  // Caso exitoso: reserva cancelada correctamente
  it("debe retornar 200 cuando la reserva es cancelada", async () => {

    const { tableId } = await seedReservation(null);

    const createResponse = await request(app)
      .post("/api/reservations")
      .send({
        table_id: tableId,
        reservation_time: "2026-06-01T19:00:00",
        party_size: 4
      });

    expect(createResponse.status).toBe(201);

    const reservationId = createResponse.body.reservation?._id ||
                          createResponse.body.reservation?.id;

    reservationService.reservationDAO.getByEmail = jest.fn().mockResolvedValue({
      _id: createResponse.body.reservation.user_id,
      id: createResponse.body.reservation.user_id,
      email: "carlos.mora@lasazontica.com"
    });

    const response = await request(app)
      .delete(`/api/reservations/${reservationId}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Reserva cancelada correctamente");
  });

  // Error 404: la reserva no existe
  it("debe retornar 404 si la reserva no existe", async () => {

    const fakeId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .delete(`/api/reservations/${fakeId}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Reserva no encontrada");
  });

  // Error 400: reserva ya cancelada
  it("debe retornar 400 si la reserva ya está cancelada", async () => {

    const { tableId } = await seedReservation(null);

    const createResponse = await request(app)
      .post("/api/reservations")
      .send({
        table_id: tableId,
        reservation_time: "2026-06-01T20:00:00",
        party_size: 2
      });

    expect(createResponse.status).toBe(201);

    const reservationId = createResponse.body.reservation?._id ||
                          createResponse.body.reservation?.id;

    reservationService.reservationDAO.getByEmail = jest.fn().mockResolvedValue({
      _id: createResponse.body.reservation.user_id,
      id: createResponse.body.reservation.user_id,
      email: "carlos.mora@lasazontica.com"
    });

    // Cancelamos la primera vez
    await request(app).delete(`/api/reservations/${reservationId}`);

    // Intentamos cancelar de nuevo
    const response = await request(app)
      .delete(`/api/reservations/${reservationId}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("La reserva ya está cancelada");
  });

});