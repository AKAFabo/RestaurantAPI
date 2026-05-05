import Reservation from "../../models/reservations.Model.js";
import Restaurant from "../../models/restaurant.model.js";
import User from "../../models/user.Model.js";  
import ReservationDAO from "./reservation.dao.abstract.js";
import mongoose from "mongoose";


class MongoReservationDAO extends ReservationDAO {

  async getByEmail(email) {
    const user = await User.findOne({ email });
    return user || null;
  }

  

  async createReservation({ user_id, table_id, reservation_time }) {

    const tableObjectId = new mongoose.Types.ObjectId(table_id);
    const userObjectId = new mongoose.Types.ObjectId(user_id);

    // buscar restaurant que tenga esa mesa
    const restaurant = await Restaurant.findOne({
      "tables._id": tableObjectId
    });

    if (!restaurant) {
      throw new Error("Mesa no existe");
    }

    // verificar disponibilidad
    const existing = await Reservation.findOne({
      table_id: tableObjectId,
      reservation_time,
      status: "CONFIRMED"
    });

    if (existing) {
      throw new Error("Mesa no disponible en ese horario");
    }

    // crear reserva
    const reservation = await Reservation.create({
      user_id: userObjectId,
      restaurant_id: restaurant._id,
      table_id: tableObjectId,
      reservation_time,
      status: "CONFIRMED"
    });

    return reservation;
}

async deleteReservation(reservation_id, user_id) {

    const reservationObjectId = new mongoose.Types.ObjectId(reservation_id);
    
    const reserva = await Reservation.findById(reservationObjectId);
    
    if (!reserva) {
      return "NOT_FOUND";
    }

    if (reserva.user_id.toString() !== user_id.toString()) {
      return "NOT_OWNER";
    }

    if (reserva.status === "CANCELLED") {
      return "ALREADY_CANCELLED";
    }

    // Incluir restaurant_id (shard key) en la query
    await Reservation.findOneAndUpdate(
      { _id: reservationObjectId, restaurant_id: reserva.restaurant_id },
      { status: "CANCELLED" }
    );

    return "OK";
  }
}

export default new MongoReservationDAO();