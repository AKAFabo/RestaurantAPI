import { createReservation } from "../controllers/reservascontroller.js";
import * as reservationDAO from "../daos/reservationDao.js";
import { deletereservation } from "../controllers/reservascontroller.js";

jest.mock("../daos/reservationDao.js");

describe("createReservation", () => {

  //  Caso exitoso
  it("debe crear una reserva correctamente", async () => {

    const fakeUser = { id: 1 };
    const fakeReservation = { id: 10, table_id: 2 };

    reservationDAO.getByEmail.mockResolvedValue(fakeUser);
    reservationDAO.createReservation.mockResolvedValue(fakeReservation);

    const req = {
      body: {
        table_id: 2,
        reservation_time: "2026-03-25 18:00",
        party_size: 4
      },
      kauth: {
        grant: {
          access_token: {
            content: { email: "test@mail.com" }
          }
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await createReservation(req, res);

    expect(reservationDAO.getByEmail).toHaveBeenCalledWith("test@mail.com");

    expect(reservationDAO.createReservation).toHaveBeenCalledWith({
      user_id: 1,
      table_id: 2,
      reservation_time: "2026-03-25 18:00",
      party_size: 4
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Reserva creada",
      reservation: fakeReservation
    });
  });

  // Faltan datos
  it("debe devolver 400 si faltan datos", async () => {

    const req = {
      body: {},
      kauth: {
        grant: {
          access_token: {
            content: { email: "test@mail.com" }
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

  //  Usuario no autenticado
  it("debe devolver 401 si no hay usuario autenticado", async () => {

    const req = {
      body: {
        table_id: 2,
        reservation_time: "2026-03-25 18:00",
        party_size: 4
      },
      kauth: {} // sin email
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await createReservation(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Usuario no autenticado"
    });
  });

  //  Usuario no existe en DB
  it("debe devolver 404 si el usuario no existe", async () => {

    reservationDAO.getByEmail.mockResolvedValue(null);

    const req = {
      body: {
        table_id: 2,
        reservation_time: "2026-03-25 18:00",
        party_size: 4
      },
      kauth: {
        grant: {
          access_token: {
            content: { email: "test@mail.com" }
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
    expect(res.json).toHaveBeenCalledWith({
      error: "Usuario no existe en la BD"
    });
  });

  //  Error interno
  it("debe devolver 500 si ocurre un error", async () => {

    reservationDAO.getByEmail.mockResolvedValue({ id: 1 });
    reservationDAO.createReservation.mockRejectedValue(new Error("DB error"));

    const req = {
      body: {
        table_id: 2,
        reservation_time: "2026-03-25 18:00",
        party_size: 4
      },
      kauth: {
        grant: {
          access_token: {
            content: { email: "test@mail.com" }
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
  });

});

///





describe("deletereservation", () => {

  //  Cancelación exitosa
  it("debe cancelar una reserva correctamente", async () => {

    reservationDAO.getByEmail.mockResolvedValue({ id: 1 });
    reservationDAO.deletereservation.mockResolvedValue("OK");

    const req = {
      params: { id: 1 },
      kauth: {
        grant: {
          access_token: {
            content: { email: "test@mail.com" }
          }
        }
      }
    };

    const res = {
      json: jest.fn()
    };

    await deletereservation(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: "Reserva cancelada correctamente"
    });
  });

  //  Falta ID
  it("debe devolver 400 si falta id", async () => {

    const req = {
      params: {},
      kauth: {
        grant: {
          access_token: {
            content: { email: "test@mail.com" }
          }
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await deletereservation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  // Usuario no autenticado
  it("debe devolver 401 si no hay usuario autenticado", async () => {

    const req = {
      params: { id: 1 },
      kauth: {}
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await deletereservation(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  // Usuario no existe
  it("debe devolver 404 si el usuario no existe", async () => {

    reservationDAO.getByEmail.mockResolvedValue(null);

    const req = {
      params: { id: 1 },
      kauth: {
        grant: {
          access_token: {
            content: { email: "test@mail.com" }
          }
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await deletereservation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  //  Reserva no encontrada
  it("debe devolver 404 si la reserva no existe", async () => {

    reservationDAO.getByEmail.mockResolvedValue({ id: 1 });
    reservationDAO.deletereservation.mockResolvedValue("NOT_FOUND");

    const req = {
      params: { id: 1 },
      kauth: {
        grant: {
          access_token: {
            content: { email: "test@mail.com" }
          }
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await deletereservation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  //  No es dueño
  it("debe devolver 403 si no es dueño de la reserva", async () => {

    reservationDAO.getByEmail.mockResolvedValue({ id: 1 });
    reservationDAO.deletereservation.mockResolvedValue("NOT_OWNER");

    const req = {
      params: { id: 1 },
      kauth: {
        grant: {
          access_token: {
            content: { email: "test@mail.com" }
          }
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await deletereservation(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  //  Ya cancelada
  it("debe devolver 400 si la reserva ya está cancelada", async () => {

    reservationDAO.getByEmail.mockResolvedValue({ id: 1 });
    reservationDAO.deletereservation.mockResolvedValue("ALREADY_CANCELLED");

    const req = {
      params: { id: 1 },
      kauth: {
        grant: {
          access_token: {
            content: { email: "test@mail.com" }
          }
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await deletereservation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  //  Error interno
  it("debe devolver 500 si ocurre un error", async () => {

    reservationDAO.getByEmail.mockResolvedValue({ id: 1 });
    reservationDAO.deletereservation.mockRejectedValue(new Error("DB error"));

    const req = {
      params: { id: 1 },
      kauth: {
        grant: {
          access_token: {
            content: { email: "test@mail.com" }
          }
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await deletereservation(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});