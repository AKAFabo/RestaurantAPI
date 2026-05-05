// reservationController.test.js
// Pruebas unitarias del controlador de reservaciones
// Mockea el reservationService ya que el controller depende de él

import { createReservation, deleteReservation } from "../controllers/reservascontroller.js";

// Mock del módulo de servicios
jest.mock("../services/config.js", () => ({
  reservationService: {
    createReservation: jest.fn(),
    deleteReservation: jest.fn(),
  }
}));

import { reservationService } from "../services/config.js";

// ─────────────────────────────────────────────
// PRUEBAS: createReservation
// ─────────────────────────────────────────────
describe("createReservation", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Caso exitoso: reserva creada correctamente
  it("debe crear una reserva y retornar 201", async () => {

    const fakeReservation = {
      id: 10,
      user_id: 1,
      table_id: 3,
      reservation_time: "2026-06-01T19:00:00",
      party_size: 4,
      status: "CONFIRMED"
    };

    reservationService.createReservation.mockResolvedValue({ reservation: fakeReservation });

    const req = {
      body: {
        table_id: 3,
        reservation_time: "2026-06-01T19:00:00",
        party_size: 4
      },
      kauth: {
        grant: {
          access_token: {
            content: { email: "cliente@restaurante.com" }
          }
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await createReservation(req, res);

    expect(reservationService.createReservation).toHaveBeenCalledWith({
      email: "cliente@restaurante.com",
      table_id: 3,
      reservation_time: "2026-06-01T19:00:00",
      party_size: 4
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Reserva creada",
      reservation: fakeReservation
    });
  });

  // Error 400: faltan campos requeridos en el body
  it("debe retornar 400 si faltan campos requeridos", async () => {

    const req = {
      body: { table_id: 3 }, // faltan reservation_time y party_size
      kauth: {
        grant: {
          access_token: {
            content: { email: "cliente@restaurante.com" }
          }
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await createReservation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "table_id, reservation_time y party_size son requeridos"
    });
  });

  // Error 401: no hay usuario autenticado
  it("debe retornar 401 si no hay usuario autenticado", async () => {

    const req = {
      body: {
        table_id: 3,
        reservation_time: "2026-06-01T19:00:00",
        party_size: 4
      },
      kauth: null // sin token
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await createReservation(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Usuario no autenticado" });
  });

  // Error 404: usuario no existe en la BD
  it("debe retornar 404 si el usuario no existe en la BD", async () => {

    reservationService.createReservation.mockResolvedValue({ error: "USER_NOT_FOUND" });

    const req = {
      body: {
        table_id: 3,
        reservation_time: "2026-06-01T19:00:00",
        party_size: 4
      },
      kauth: {
        grant: {
          access_token: {
            content: { email: "noexiste@restaurante.com" }
          }
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await createReservation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Usuario no existe en la BD" });
  });

  // Error 500: falla inesperada en el service
  it("debe retornar 500 si ocurre un error interno", async () => {

    reservationService.createReservation.mockRejectedValue(new Error("Mesa no disponible en ese horario"));

    const req = {
      body: {
        table_id: 3,
        reservation_time: "2026-06-01T19:00:00",
        party_size: 4
      },
      kauth: {
        grant: {
          access_token: {
            content: { email: "cliente@restaurante.com" }
          }
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await createReservation(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Mesa no disponible en ese horario" });
  });

});

// ─────────────────────────────────────────────
// PRUEBAS: deleteReservation
// ─────────────────────────────────────────────
describe("deleteReservation", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Caso exitoso: reserva cancelada correctamente
  it("debe cancelar la reserva y retornar mensaje de éxito", async () => {

    reservationService.deleteReservation.mockResolvedValue({ result: "OK" });

    const req = {
      params: { id: 10 },
      kauth: {
        grant: {
          access_token: {
            content: { email: "cliente@restaurante.com" }
          }
        }
      }
    };

    const res = { json: jest.fn() };

    await deleteReservation(req, res);

    expect(reservationService.deleteReservation).toHaveBeenCalledWith({
      id: 10,
      email: "cliente@restaurante.com"
    });
    expect(res.json).toHaveBeenCalledWith({ message: "Reserva cancelada correctamente" });
  });

  // Error 400: falta el id
  it("debe retornar 400 si falta el id", async () => {

    const req = {
      params: {},
      kauth: {
        grant: {
          access_token: {
            content: { email: "cliente@restaurante.com" }
          }
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await deleteReservation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "ID requerido" });
  });

  // Error 401: no hay usuario autenticado
  it("debe retornar 401 si no hay usuario autenticado", async () => {

    const req = {
      params: { id: 10 },
      kauth: null
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await deleteReservation(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Usuario no autenticado" });
  });

  // Error 404: usuario no existe en la BD
  it("debe retornar 404 si el usuario no existe en la BD", async () => {

    reservationService.deleteReservation.mockResolvedValue({ error: "USER_NOT_FOUND" });

    const req = {
      params: { id: 10 },
      kauth: {
        grant: {
          access_token: {
            content: { email: "noexiste@restaurante.com" }
          }
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await deleteReservation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Usuario no existe en la BD" });
  });

  // Error 404: la reserva no existe
  it("debe retornar 404 si la reserva no existe", async () => {

    reservationService.deleteReservation.mockResolvedValue({ result: "NOT_FOUND" });

    const req = {
      params: { id: 99 },
      kauth: {
        grant: {
          access_token: {
            content: { email: "cliente@restaurante.com" }
          }
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await deleteReservation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Reserva no encontrada" });
  });

  // Error 403: el usuario no es dueño de la reserva
  it("debe retornar 403 si el usuario no es dueño de la reserva", async () => {

    reservationService.deleteReservation.mockResolvedValue({ result: "NOT_OWNER" });

    const req = {
      params: { id: 10 },
      kauth: {
        grant: {
          access_token: {
            content: { email: "cliente@restaurante.com" }
          }
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await deleteReservation(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "No puedes cancelar esta reserva" });
  });

  // Error 400: la reserva ya estaba cancelada
  it("debe retornar 400 si la reserva ya está cancelada", async () => {

    reservationService.deleteReservation.mockResolvedValue({ result: "ALREADY_CANCELLED" });

    const req = {
      params: { id: 10 },
      kauth: {
        grant: {
          access_token: {
            content: { email: "cliente@restaurante.com" }
          }
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await deleteReservation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "La reserva ya está cancelada" });
  });

  // Error 500: falla inesperada en el service
  it("debe retornar 500 si ocurre un error interno", async () => {

    reservationService.deleteReservation.mockRejectedValue(new Error("Error inesperado"));

    const req = {
      params: { id: 10 },
      kauth: {
        grant: {
          access_token: {
            content: { email: "cliente@restaurante.com" }
          }
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await deleteReservation(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error cancelando reserva" });
  });

});