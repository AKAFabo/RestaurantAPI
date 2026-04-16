
import { reservationService } from "../services/config.js";



export const createReservation = async (req, res) => {
  try {

    const { table_id, reservation_time, party_size } = req.body;

    const user = req.kauth?.grant?.access_token?.content;
    const email = user?.email;

    if (!table_id || !reservation_time || !party_size) {
      return res.status(400).json({
        error: "table_id, reservation_time y party_size son requeridos"
      });
    }

    if (!email) {
      return res.status(401).json({
        error: "Usuario no autenticado"
      });
    }

    const { error, reservation } =
      await reservationService.createReservation({
        email,
        table_id,
        reservation_time,
        party_size
      });

    if (error === "USER_NOT_FOUND") {
      return res.status(404).json({
        error: "Usuario no existe en la BD"
      });
    }

    res.status(201).json({
      message: "Reserva creada",
      reservation
    });

  } catch (error) {
    console.error("Error creando reserva:", error);

    res.status(500).json({
      error: error.message
    });
  }
};
export const deleteReservation = async (req, res) => {
  try {

    const { id } = req.params;

    const user = req.kauth?.grant?.access_token?.content;
    const email = user?.email;

    if (!id) {
      return res.status(400).json({
        error: "ID requerido"
      });
    }

    if (!email) {
      return res.status(401).json({
        error: "Usuario no autenticado"
      });
    }

    const { error, result } =
      await reservationService.deleteReservation({ id, email });

    if (error === "USER_NOT_FOUND") {
      return res.status(404).json({
        error: "Usuario no existe en la BD"
      });
    }

    if (result === "NOT_FOUND") {
      return res.status(404).json({
        error: "Reserva no encontrada"
      });
    }

    if (result === "NOT_OWNER") {
      return res.status(403).json({
        error: "No puedes cancelar esta reserva"
      });
    }

    if (result === "ALREADY_CANCELLED") {
      return res.status(400).json({
        error: "La reserva ya está cancelada"
      });
    }

    res.json({
      message: "Reserva cancelada correctamente"
    });

  } catch (error) {
    console.error("Error cancelando reserva:", error);

    res.status(500).json({
      error: "Error cancelando reserva"
    });
  }
};