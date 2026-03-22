import pool from "../config/database.js";

export const createreservaion = async({user_id,table_id,reservation_time}) =>{

    const client = await pool.connect();

    try{

        // verificar si la mesa existe
        await client.query("BEGIN");
        const tablacheck = await client.query(
            `SELECT id FROM tables WHERE id = $1`,
            [table_id]
        );

        if (tablacheck.row.length===0){
            await client.query("ROLLBACK");

            throw new Error("Mesa no existe");
        }
        // verificar si ya hay una reserva para esa mesa 
        const disponibilidad= await client.query(
            `SELECT id FROM tables WHERE id = $1`,
            [table_id]

        );

        if (disponibilidad.row.length>0){
            await client.query("ROLLBACK")
            throw new Error("Mesa no esta disponible en ese horario")

        }

        // crear reserva 
        const insertQuery = `
        INSERT INTO reservations 
        (user_id, table_id, reservation_time, status, created_at)
        VALUES ($1, $2, $3, 'active', NOW())
        RETURNING *
        `;

        const result = await client.query(insertQuery, [
        user_id,
        table_id,
        reservation_time
        ]);

        await client.query("COMMIT");
        return result.rows[0];



    }
    catch (error){
        await client.query("ROLLBACK");
        throw error;

    } finally{
        client.release()
    }
}



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