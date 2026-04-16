class ReservationService {
  constructor(reservationDAO) {
    this.reservationDAO = reservationDAO;
  }

  async createReservation({ email, table_id, reservation_time, party_size }) {

    // obtener usuario
    const dbUser = await this.reservationDAO.getByEmail(email);

    if (!dbUser) {
      return { error: "USER_NOT_FOUND" };
    }

    const reservation = await this.reservationDAO.createReservation({
      user_id: dbUser.id,
      table_id,
      reservation_time,
      party_size
    });

    return { reservation };
  }


  async deleteReservation({ id, email }) {

    const dbUser = await this.reservationDAO.getByEmail(email);

    if (!dbUser) {
      return { error: "USER_NOT_FOUND" };
    }

    const result = await this.reservationDAO.deleteReservation(id, dbUser.id);

    return { result };
  }
}

export default ReservationService;