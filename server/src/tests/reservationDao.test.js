import { createReservation, deletereservation, getByEmail } from "../daos/reservationDao.js";
import { pool } from "../config/database.js";

jest.mock("../config/database.js", () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn()
  }
}));

describe("createReservation", () => {

  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    pool.connect.mockResolvedValue(mockClient);
  });

  //  Caso exitoso
  it("debe crear una reserva correctamente", async () => {

    const fakeReservation = { id: 1, user_id: 1, table_id: 2, status: "CONFIRMED" };

    mockClient.query
      .mockResolvedValueOnce()                                        // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 2 }] })                  // tableCheck
      .mockResolvedValueOnce({ rows: [] })                            // availabilityCheck
      .mockResolvedValueOnce({ rows: [fakeReservation] })             // INSERT
      .mockResolvedValueOnce();                                       // COMMIT

    const result = await createReservation({
      user_id: 1,
      table_id: 2,
      reservation_time: "2026-03-25 18:00",
      party_size: 4
    });

    expect(result).toEqual(fakeReservation);
    expect(mockClient.release).toHaveBeenCalled();
  });

  //  Mesa no existe
  it("debe lanzar error si la mesa no existe", async () => {

    mockClient.query
      .mockResolvedValueOnce()                    // BEGIN
      .mockResolvedValueOnce({ rows: [] });       // tableCheck vacío

    await expect(createReservation({
      user_id: 1,
      table_id: 99,
      reservation_time: "2026-03-25 18:00",
      party_size: 4
    })).rejects.toThrow("Mesa no existe");

    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    expect(mockClient.release).toHaveBeenCalled();
  });

  //  Mesa no disponible
  it("debe lanzar error si la mesa no está disponible", async () => {

    mockClient.query
      .mockResolvedValueOnce()                                    // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 2 }] })              // tableCheck
      .mockResolvedValueOnce({ rows: [{ id: 5 }] });             // availabilityCheck (ocupada)

    await expect(createReservation({
      user_id: 1,
      table_id: 2,
      reservation_time: "2026-03-25 18:00",
      party_size: 4
    })).rejects.toThrow("Mesa no disponible en ese horario");
  });

});


describe("deletereservation", () => {

  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    pool.connect.mockResolvedValue(mockClient);
  });

  //  Caso exitoso
  it("debe cancelar una reserva correctamente", async () => {

    const fakeReservation = { id: 1, user_id: 1, status: "CONFIRMED" };

    mockClient.query
      .mockResolvedValueOnce()                                        // BEGIN
      .mockResolvedValueOnce({ rows: [fakeReservation] })             // SELECT reserva
      .mockResolvedValueOnce()                                        // UPDATE status
      .mockResolvedValueOnce();                                       // COMMIT

    const result = await deletereservation(1, 1);

    expect(result).toBe("OK");
    expect(mockClient.release).toHaveBeenCalled();
  });

  //  Reserva no encontrada
  it("debe devolver NOT_FOUND si la reserva no existe", async () => {

    mockClient.query
      .mockResolvedValueOnce()                    // BEGIN
      .mockResolvedValueOnce({ rows: [] });       // SELECT vacío

    const result = await deletereservation(99, 1);

    expect(result).toBe("NOT_FOUND");
  });

  //  No es dueño
  it("debe devolver NOT_OWNER si el usuario no es dueño", async () => {

    const fakeReservation = { id: 1, user_id: 2, status: "CONFIRMED" };

    mockClient.query
      .mockResolvedValueOnce()                                        // BEGIN
      .mockResolvedValueOnce({ rows: [fakeReservation] });            // SELECT

    const result = await deletereservation(1, 1);

    expect(result).toBe("NOT_OWNER");
  });

  //  Ya cancelada
  it("debe devolver ALREADY_CANCELLED si ya está cancelada", async () => {

    const fakeReservation = { id: 1, user_id: 1, status: "cancelled" };

    mockClient.query
      .mockResolvedValueOnce()                                        // BEGIN
      .mockResolvedValueOnce({ rows: [fakeReservation] });            // SELECT

    const result = await deletereservation(1, 1);

    expect(result).toBe("ALREADY_CANCELLED");
  });

  //  Error de BD
  it("debe lanzar error si falla la consulta", async () => {

    mockClient.query
      .mockResolvedValueOnce()                                    // BEGIN
      .mockRejectedValueOnce(new Error("DB error"));              // SELECT falla

    await expect(deletereservation(1, 1)).rejects.toThrow("DB error");
    expect(mockClient.release).toHaveBeenCalled();
  });

});


describe("getByEmail", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  //  Caso exitoso
  it("debe devolver el usuario por email", async () => {

    const fakeUser = { id: 1, name: "Test", email: "test@mail.com", role_id: 1 };

    pool.query.mockResolvedValue({ rows: [fakeUser] });

    const result = await getByEmail("test@mail.com");

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("WHERE email"),
      ["test@mail.com"]
    );
    expect(result).toEqual(fakeUser);
  });

  //  No existe
  it("debe devolver null si no existe el usuario", async () => {

    pool.query.mockResolvedValue({ rows: [] });

    const result = await getByEmail("noexiste@mail.com");

    expect(result).toBeNull();
  });

  //  Error de BD
  it("debe lanzar error si falla la consulta", async () => {

    pool.query.mockRejectedValue(new Error("DB error"));

    await expect(getByEmail("test@mail.com")).rejects.toThrow("DB error");
  });

});
