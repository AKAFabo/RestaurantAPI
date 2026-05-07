

import dao from "../daos/reservation/reservation.postgres.Dao.js";
import { pool } from "../config/database.js";

jest.mock("../config/database.js", () => ({
  pool: {
    connect: jest.fn(),
    query: jest.fn()
  }
}));

describe("PostgresReservationDAO", () => {

  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };

    pool.connect.mockResolvedValue(mockClient);
    jest.clearAllMocks();
  });

  // ─────────────────────────────
  // CREATE RESERVATION
  // ─────────────────────────────

  describe("createReservation", () => {

    it("debe crear la reserva correctamente", async () => {

      mockClient.query
        .mockResolvedValueOnce() // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // mesa existe
        .mockResolvedValueOnce({ rows: [] }) // disponible
        .mockResolvedValueOnce({
          rows: [{ id: 10, status: "CONFIRMED" }]
        }) // insert
        .mockResolvedValueOnce(); // COMMIT

      const result = await dao.createReservation({
        user_id: 1,
        table_id: 2,
        reservation_time: "2026-06-01",
        party_size: 4
      });

      expect(result.id).toBe(10);

      // Verifica flujo de transacción
      expect(mockClient.query.mock.calls[0][0]).toBe("BEGIN");
      expect(mockClient.query.mock.calls[4][0]).toBe("COMMIT");

      expect(mockClient.release).toHaveBeenCalled();
    });

    it("debe hacer rollback si la mesa no existe", async () => {

      mockClient.query
        .mockResolvedValueOnce() // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // mesa no existe
        .mockResolvedValueOnce(); // ROLLBACK

      await expect(dao.createReservation({
        user_id: 1,
        table_id: 99,
        reservation_time: "2026",
        party_size: 2
      })).rejects.toThrow("Mesa no existe");

      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    });

    it("debe hacer rollback si la mesa no está disponible", async () => {

      mockClient.query
        .mockResolvedValueOnce() // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // mesa ok
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // ocupada
        .mockResolvedValueOnce(); // ROLLBACK

      await expect(dao.createReservation({
        user_id: 1,
        table_id: 2,
        reservation_time: "2026",
        party_size: 2
      })).rejects.toThrow("Mesa no disponible");

      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    });

    it("debe hacer rollback si falla el insert", async () => {

      mockClient.query
        .mockResolvedValueOnce() // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockRejectedValueOnce(new Error("DB error")) // INSERT falla
        .mockResolvedValueOnce(); // ROLLBACK

      await expect(dao.createReservation({
        user_id: 1,
        table_id: 2,
        reservation_time: "2026",
        party_size: 2
      })).rejects.toThrow("DB error");

      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    });

  });

  // ─────────────────────────────
  // DELETE RESERVATION
  // ─────────────────────────────

  describe("deleteReservation", () => {

    it("debe cancelar correctamente", async () => {

      mockClient.query
        .mockResolvedValueOnce() // BEGIN
        .mockResolvedValueOnce({
          rows: [{ id: 10, user_id: 1, status: "CONFIRMED" }]
        })
        .mockResolvedValueOnce() // UPDATE
        .mockResolvedValueOnce(); // COMMIT

      const result = await dao.deleteReservation(10, 1);

      expect(result).toBe("OK");
      expect(mockClient.query.mock.calls[0][0]).toBe("BEGIN");
      expect(mockClient.query.mock.calls[3][0]).toBe("COMMIT");
    });

    it("debe retornar NOT_FOUND", async () => {

      mockClient.query
        .mockResolvedValueOnce() // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // no existe
        .mockResolvedValueOnce(); // ROLLBACK

      const result = await dao.deleteReservation(10, 1);

      expect(result).toBe("NOT_FOUND");
    });

    it("debe retornar NOT_OWNER", async () => {

      mockClient.query
        .mockResolvedValueOnce()
        .mockResolvedValueOnce({
          rows: [{ id: 10, user_id: 2, status: "CONFIRMED" }]
        })
        .mockResolvedValueOnce(); // ROLLBACK

      const result = await dao.deleteReservation(10, 1);

      expect(result).toBe("NOT_OWNER");
    });

    it("debe retornar ALREADY_CANCELLED", async () => {

      mockClient.query
        .mockResolvedValueOnce()
        .mockResolvedValueOnce({
          rows: [{ id: 10, user_id: 1, status: "cancelled" }]
        })
        .mockResolvedValueOnce(); // ROLLBACK

      const result = await dao.deleteReservation(10, 1);

      expect(result).toBe("ALREADY_CANCELLED");
    });

    it("debe hacer rollback si hay error", async () => {

      mockClient.query
        .mockResolvedValueOnce() // BEGIN
        .mockRejectedValueOnce(new Error("DB error"))
        .mockResolvedValueOnce(); // ROLLBACK

      await expect(dao.deleteReservation(10, 1))
        .rejects.toThrow("DB error");

      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    });

  });

  // ─────────────────────────────
  // GET BY EMAIL
  // ─────────────────────────────

  describe("getByEmail", () => {

    it("debe retornar usuario si existe", async () => {

      pool.query.mockResolvedValue({
        rows: [{ id: 1, email: "test@test.com" }]
      });

      const result = await dao.getByEmail("test@test.com");

      expect(result.email).toBe("test@test.com");
    });

    it("debe retornar null si no existe", async () => {

      pool.query.mockResolvedValue({ rows: [] });

      const result = await dao.getByEmail("no@test.com");

      expect(result).toBeNull();
    });

    it("debe propagar error si falla la query", async () => {

      pool.query.mockRejectedValue(new Error("DB error"));

      await expect(dao.getByEmail("test@test.com"))
        .rejects.toThrow("DB error");
    });

  });

});