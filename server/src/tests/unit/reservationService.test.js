// reservationService.test.js
// Pruebas unitarias del ReservationService
// Verifica la lógica de negocio: validaciones, permisos y delegación al DAO

import ReservationService from "../../services/reservation.service.js";

// ─────────────────────────────────────────────
// SETUP: creamos un DAO falso antes de cada prueba
// ─────────────────────────────────────────────

const createMockDAO = () => ({
  getByEmail: jest.fn(),
  createReservation: jest.fn(),
  deleteReservation: jest.fn(),
});

// ─────────────────────────────────────────────
// PRUEBAS: createReservation
// ─────────────────────────────────────────────
describe("ReservationService - createReservation", () => {

  let reservationService;
  let mockDAO;

  beforeEach(() => {
    mockDAO = createMockDAO();
    reservationService = new ReservationService(mockDAO);
  });

  // Caso exitoso: usuario existe y reserva se crea correctamente
  it("debe crear una reserva correctamente cuando el usuario existe", async () => {

    const fakeUser = { id: 1, email: "cliente@restaurante.com" };
    const fakeReservation = {
      id: 10,
      user_id: 1,
      table_id: 3,
      reservation_time: "2026-06-01T19:00:00",
      party_size: 4,
      status: "CONFIRMED"
    };

    mockDAO.getByEmail.mockResolvedValue(fakeUser);
    mockDAO.createReservation.mockResolvedValue(fakeReservation);

    const result = await reservationService.createReservation({
      email: "cliente@restaurante.com",
      table_id: 3,
      reservation_time: "2026-06-01T19:00:00",
      party_size: 4
    });

    // Verifica que buscó al usuario por email
    expect(mockDAO.getByEmail).toHaveBeenCalledWith("cliente@restaurante.com");
    // Verifica que creó la reserva con el user_id correcto
    expect(mockDAO.createReservation).toHaveBeenCalledWith({
      user_id: fakeUser.id,
      table_id: 3,
      reservation_time: "2026-06-01T19:00:00",
      party_size: 4
    });
    expect(result).toEqual({ reservation: fakeReservation });
  });

  // Caso: el usuario no existe en la base de datos
  it("debe retornar error USER_NOT_FOUND si el usuario no existe", async () => {

    mockDAO.getByEmail.mockResolvedValue(null);

    const result = await reservationService.createReservation({
      email: "noexiste@restaurante.com",
      table_id: 3,
      reservation_time: "2026-06-01T19:00:00",
      party_size: 4
    });

    // Verifica que no intentó crear la reserva
    expect(mockDAO.createReservation).not.toHaveBeenCalled();
    expect(result).toEqual({ error: "USER_NOT_FOUND" });
  });

  // Caso: la mesa no está disponible, el DAO lanza error
  it("debe propagar el error si la mesa no está disponible", async () => {

    const fakeUser = { id: 1, email: "cliente@restaurante.com" };

    mockDAO.getByEmail.mockResolvedValue(fakeUser);
    mockDAO.createReservation.mockRejectedValue(new Error("Mesa no disponible en ese horario"));

    await expect(reservationService.createReservation({
      email: "cliente@restaurante.com",
      table_id: 3,
      reservation_time: "2026-06-01T19:00:00",
      party_size: 4
    })).rejects.toThrow("Mesa no disponible en ese horario");
  });

  // Caso: error inesperado en el DAO
  it("debe propagar el error si el DAO falla", async () => {

    mockDAO.getByEmail.mockRejectedValue(new Error("DB error"));

    await expect(reservationService.createReservation({
      email: "cliente@restaurante.com",
      table_id: 3,
      reservation_time: "2026-06-01T19:00:00",
      party_size: 4
    })).rejects.toThrow("DB error");
  });

});

// ─────────────────────────────────────────────
// PRUEBAS: deleteReservation
// ─────────────────────────────────────────────
describe("ReservationService - deleteReservation", () => {

  let reservationService;
  let mockDAO;

  beforeEach(() => {
    mockDAO = createMockDAO();
    reservationService = new ReservationService(mockDAO);
  });

  // Caso exitoso: reserva cancelada correctamente
  it("debe cancelar la reserva correctamente cuando el usuario es el dueño", async () => {

    const fakeUser = { id: 1, email: "cliente@restaurante.com" };

    mockDAO.getByEmail.mockResolvedValue(fakeUser);
    mockDAO.deleteReservation.mockResolvedValue("OK");

    const result = await reservationService.deleteReservation({
      id: 10,
      email: "cliente@restaurante.com"
    });

    // Verifica que buscó al usuario y llamó deleteReservation con los ids correctos
    expect(mockDAO.getByEmail).toHaveBeenCalledWith("cliente@restaurante.com");
    expect(mockDAO.deleteReservation).toHaveBeenCalledWith(10, fakeUser.id);
    expect(result).toEqual({ result: "OK" });
  });

  // Caso: el usuario no existe
  it("debe retornar error USER_NOT_FOUND si el usuario no existe", async () => {

    mockDAO.getByEmail.mockResolvedValue(null);

    const result = await reservationService.deleteReservation({
      id: 10,
      email: "noexiste@restaurante.com"
    });

    // Verifica que no intentó eliminar la reserva
    expect(mockDAO.deleteReservation).not.toHaveBeenCalled();
    expect(result).toEqual({ error: "USER_NOT_FOUND" });
  });

  // Caso: la reserva no existe, el DAO retorna NOT_FOUND
  it("debe retornar NOT_FOUND si la reserva no existe", async () => {

    const fakeUser = { id: 1, email: "cliente@restaurante.com" };

    mockDAO.getByEmail.mockResolvedValue(fakeUser);
    mockDAO.deleteReservation.mockResolvedValue("NOT_FOUND");

    const result = await reservationService.deleteReservation({
      id: 99,
      email: "cliente@restaurante.com"
    });

    expect(result).toEqual({ result: "NOT_FOUND" });
  });

  // Caso: el usuario no es dueño de la reserva
  it("debe retornar NOT_OWNER si el usuario no es dueño", async () => {

    const fakeUser = { id: 1, email: "cliente@restaurante.com" };

    mockDAO.getByEmail.mockResolvedValue(fakeUser);
    mockDAO.deleteReservation.mockResolvedValue("NOT_OWNER");

    const result = await reservationService.deleteReservation({
      id: 10,
      email: "cliente@restaurante.com"
    });

    expect(result).toEqual({ result: "NOT_OWNER" });
  });

  // Caso: la reserva ya estaba cancelada
  it("debe retornar ALREADY_CANCELLED si la reserva ya fue cancelada", async () => {

    const fakeUser = { id: 1, email: "cliente@restaurante.com" };

    mockDAO.getByEmail.mockResolvedValue(fakeUser);
    mockDAO.deleteReservation.mockResolvedValue("ALREADY_CANCELLED");

    const result = await reservationService.deleteReservation({
      id: 10,
      email: "cliente@restaurante.com"
    });

    expect(result).toEqual({ result: "ALREADY_CANCELLED" });
  });

  // Caso: error inesperado en el DAO
  it("debe propagar el error si el DAO falla", async () => {

    mockDAO.getByEmail.mockRejectedValue(new Error("DB error"));

    await expect(reservationService.deleteReservation({
      id: 10,
      email: "cliente@restaurante.com"
    })).rejects.toThrow("DB error");
  });

});