import * as reservationDAO from "../daos/reservationDao.js";


export const createReservation = async (req, res) => {
  try {

    const { table_id, reservation_time, party_size } = req.body; // parametros requeridos 

    const user = req.kauth?.grant?.access_token?.content; // user del key 
    const email = user?.email; // usuario del key 

    // validaciones
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

   
    const dbUser = await reservationDAO.getByEmail(email); // obtengo el user id de la base por medio del email

    if (!dbUser) {
      return res.status(404).json({
        error: "Usuario no existe en la BD"
      });
    }

    const reservation = await reservationDAO.createReservation({// crea la reservacion 
      user_id: dbUser.id, 
      table_id,
      reservation_time,
      party_size
    });

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

export const deletereservation = async (req,res) =>{
  try {

    const { id } = req.params;

    const user = req.kauth?.grant?.access_token?.content; // key id del usuario 
    const email = user?.email;// email del key del user 
    // validaciones 
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

   
    const dbUser = await reservationDAO.getByEmail(email); // obtiene el id de la db 

    if (!dbUser) {
      return res.status(404).json({
        error: "Usuario no existe en la BD"
      });
    }

    
    const result = await reservationDAO.deletereservation(id, dbUser.id); // elimina la reserva 

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