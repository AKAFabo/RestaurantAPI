class ReservationDAO {

  async createReservation({
    user_id,
    table_id,
    reservation_time,
    party_size
  }) {
    throw new Error("Method createReservation not implemented");
  }

  async deleteReservation(reservation_id, user_id) {
    throw new Error("Method deleteReservation not implemented");
  }

  async getByEmail(email) {
    throw new Error("Method getByEmail not implemented");
  }

}

export default ReservationDAO;