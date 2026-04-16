import ReservationDAO from "./reservation.dao.abstract.js";
import { pool } from "../config/database.js";

class PostgresReservationDAO extends ReservationDAO {

  async createReservation({
    user_id,
    table_id,
    reservation_time,
    party_size
  }) {

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // verificar mesa
      const tableCheck = await client.query(
        `SELECT id FROM tables WHERE id = $1`,
        [table_id]
      );

      if (tableCheck.rows.length === 0) {
        throw new Error("Mesa no existe");
      }

      // verificar disponibilidad
      const availabilityCheck = await client.query(
        `
        SELECT id FROM reservations
        WHERE table_id = $1
        AND reservation_time = $2
        AND status = 'CONFIRMED'
        `,
        [table_id, reservation_time]
      );

      if (availabilityCheck.rows.length > 0) {
        throw new Error("Mesa no disponible en ese horario");
      }

      // crear reserva
      const result = await client.query(
        `
        INSERT INTO reservations
        (user_id, table_id, reservation_time, party_size, status)
        VALUES ($1, $2, $3, $4, 'CONFIRMED')
        RETURNING *
        `,
        [user_id, table_id, reservation_time, party_size]
      );

      await client.query("COMMIT");

      return result.rows[0];

    } catch (error) {
      await client.query("ROLLBACK");
      throw error;

    } finally {
      client.release();
    }
  }

  async deleteReservation(reservation_id, user_id) {

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const result = await client.query(
        `
        SELECT id, user_id, status
        FROM reservations
        WHERE id = $1
        `,
        [reservation_id]
      );

      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return "NOT_FOUND";
      }

      const reservation = result.rows[0];

      if (reservation.user_id !== user_id) {
        await client.query("ROLLBACK");
        return "NOT_OWNER";
      }

      if (reservation.status === "cancelled") {
        await client.query("ROLLBACK");
        return "ALREADY_CANCELLED";
      }

      await client.query(
        `
        UPDATE reservations
        SET status = 'cancelled'
        WHERE id = $1
        `,
        [reservation_id]
      );

      await client.query("COMMIT");

      return "OK";

    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getByEmail(email) {

    const result = await pool.query(
      `
      SELECT id, name, email, role_id
      FROM users
      WHERE email = $1
      `,
      [email]
    );

    return result.rows[0] || null;
  }

}

export default new PostgresReservationDAO();