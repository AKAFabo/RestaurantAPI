
import { reservationService } from "../services/config.js";



export const createReservation = async (req, res) => {
  try {

    const { table_id, reservation_time, party_size } = req.body; // obtiene los parametros del body 
    // obtiene los datos de keycloak del usuario que se autentico
    const user = req.kauth?.grant?.access_token?.content;
    const email = user?.email;

    // revisa que vengan los datos 
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

    const { error, reservation } = // llama al service con los datos 
      await reservationService.createReservation({
        email,
        table_id,
        reservation_time,
        party_size
      });
      // verifica si devolvio un error
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

    const { id } = req.params; // obtiene id del parametro 
    // obtiene informacion del usuario autenticado 
    const user = req.kauth?.grant?.access_token?.content;
    const email = user?.email;
    // valida que vengan los datos 
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

    const { error, result } = // llama al service con los datos
      await reservationService.deleteReservation({ id, email });
    // busca errores
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