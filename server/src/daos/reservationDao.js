import {pool} from "../config/database.js";



export const createReservation = async ({
  user_id,
  table_id,
  reservation_time,
  party_size
}) => {

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
};

export const deletereservation = async (reservation_id, user_id) => {

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Buscar reserva
    const query = `
      SELECT id, user_id, status
      FROM reservations
      WHERE id = $1
    `;

    const result = await client.query(query, [reservation_id]);

    //  No existe
    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return "NOT_FOUND";
    }

    const reservation = result.rows[0];

    //  No es dueño
    if (reservation.user_id !== user_id) {
      await client.query("ROLLBACK");
      return "NOT_OWNER";
    }

    //  Ya cancelada
    if (reservation.status === "cancelled") {
      await client.query("ROLLBACK");
      return "ALREADY_CANCELLED";
    }

    //  Actualizar estado
    const updateQuery = `
      UPDATE reservations
      SET status = 'cancelled'
      WHERE id = $1
    `;

    await client.query(updateQuery, [reservation_id]);

    await client.query("COMMIT");

    return "OK";

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};



export const getByEmail = async (email) => {

  const result = await pool.query(
    `
    SELECT id, name, email, role_id
    FROM users
    WHERE email = $1
    `,
    [email]
  );

  return result.rows[0] || null;
};