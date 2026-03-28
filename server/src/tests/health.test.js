import express from "express";
import request from "supertest";
import { getDatabaseStatus } from "../config/database.js";

jest.mock("../config/database.js", () => ({
  getDatabaseStatus: jest.fn()
}));

// Importar router después del mock
import healthRouter from "../routes/health.js";

const app = express();
app.use("/health", healthRouter);

describe("GET /health", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  //  Caso healthy
  it("debe devolver 200 y status healthy cuando la BD está conectada", async () => {

    getDatabaseStatus.mockReturnValue("connected");

    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe("healthy");
    expect(res.body.database).toBe("connected");
    expect(res.body).toHaveProperty("timestamp");
    expect(res.body).toHaveProperty("uptime");
  });

  //  Caso unhealthy
  it("debe devolver 503 y status unhealthy cuando la BD está desconectada", async () => {

    getDatabaseStatus.mockReturnValue("disconnected");

    const res = await request(app).get("/health");

    expect(res.status).toBe(503);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe("unhealthy");
    expect(res.body.database).toBe("disconnected");
  });

});
