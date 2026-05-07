

import dao from "../daos/reservation/mongoReservation.dao.js";
import Reservation from "../models/reservations.Model.js";
import Restaurant from "../models/restaurant.model.js";
import User from "../models/user.Model.js";
import mongoose from "mongoose";

// ─────────────────────────────
// MOCKS
// ─────────────────────────────
jest.mock("../models/reservations.Model.js");
jest.mock("../models/restaurant.model.js");
jest.mock("../models/user.Model.js");

describe("MongoReservationDAO", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────
  // getByEmail
  // ─────────────────────────────

  describe("getByEmail", () => {

    it("debe retornar usuario si existe", async () => {
      const fakeUser = { email: "test@test.com" };

      User.findOne.mockResolvedValue(fakeUser);

      const result = await dao.getByEmail("test@test.com");

      expect(User.findOne).toHaveBeenCalledWith({ email: "test@test.com" });
      expect(result).toEqual(fakeUser);
    });

    it("debe retornar null si no existe", async () => {
      User.findOne.mockResolvedValue(null);

      const result = await dao.getByEmail("no@test.com");

      expect(result).toBeNull();
    });

  });

  // ─────────────────────────────
  // createReservation
  // ─────────────────────────────

  describe("createReservation", () => {

    it("debe crear reserva correctamente", async () => {

      const fakeRestaurant = { _id: "rest1" };
      const fakeReservation = { _id: "res1", status: "CONFIRMED" };

      Restaurant.findOne.mockResolvedValue(fakeRestaurant);
      Reservation.findOne.mockResolvedValue(null);
      Reservation.create.mockResolvedValue(fakeReservation);

      const result = await dao.createReservation({
        user_id: "user1",
        table_id: "table1",
        reservation_time: "2026-06-01"
      });

      expect(Restaurant.findOne).toHaveBeenCalled();
      expect(Reservation.create).toHaveBeenCalled();

      expect(result).toEqual(fakeReservation);
    });

    it("debe fallar si la mesa no existe", async () => {

      Restaurant.findOne.mockResolvedValue(null);

      await expect(dao.createReservation({
        user_id: "user1",
        table_id: "table1",
        reservation_time: "2026"
      })).rejects.toThrow("Mesa no existe");
    });

    it("debe fallar si la mesa no está disponible", async () => {

      Restaurant.findOne.mockResolvedValue({ _id: "rest1" });
      Reservation.findOne.mockResolvedValue({ _id: "existing" });

      await expect(dao.createReservation({
        user_id: "user1",
        table_id: "table1",
        reservation_time: "2026"
      })).rejects.toThrow("Mesa no disponible");
    });

    it("debe propagar error si falla create", async () => {

      Restaurant.findOne.mockResolvedValue({ _id: "rest1" });
      Reservation.findOne.mockResolvedValue(null);
      Reservation.create.mockRejectedValue(new Error("DB error"));

      await expect(dao.createReservation({
        user_id: "user1",
        table_id: "table1",
        reservation_time: "2026"
      })).rejects.toThrow("DB error");
    });

  });

  // ─────────────────────────────
  // deleteReservation
  // ─────────────────────────────

  describe("deleteReservation", () => {

    it("debe cancelar correctamente", async () => {

      const fakeReserva = {
        _id: "res1",
        user_id: "user1",
        status: "CONFIRMED",
        restaurant_id: "rest1"
      };

      Reservation.findById.mockResolvedValue(fakeReserva);
      Reservation.findOneAndUpdate.mockResolvedValue({});

      const result = await dao.deleteReservation("res1", "user1");

      expect(result).toBe("OK");
      expect(Reservation.findOneAndUpdate).toHaveBeenCalled();
    });

    it("debe retornar NOT_FOUND", async () => {

      Reservation.findById.mockResolvedValue(null);

      const result = await dao.deleteReservation("res1", "user1");

      expect(result).toBe("NOT_FOUND");
    });

    it("debe retornar NOT_OWNER", async () => {

      const fakeReserva = {
        user_id: "otroUser",
        status: "CONFIRMED"
      };

      Reservation.findById.mockResolvedValue(fakeReserva);

      const result = await dao.deleteReservation("res1", "user1");

      expect(result).toBe("NOT_OWNER");
    });

    it("debe retornar ALREADY_CANCELLED", async () => {

      const fakeReserva = {
        user_id: "user1",
        status: "CANCELLED"
      };

      Reservation.findById.mockResolvedValue(fakeReserva);

      const result = await dao.deleteReservation("res1", "user1");

      expect(result).toBe("ALREADY_CANCELLED");
    });

    it("debe propagar error si falla la DB", async () => {

      Reservation.findById.mockRejectedValue(new Error("DB error"));

      await expect(
        dao.deleteReservation("res1", "user1")
      ).rejects.toThrow("DB error");
    });

  });

});