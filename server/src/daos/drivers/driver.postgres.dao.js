import { pool } from "../../config/database.js";
import DriverDAO from "./driver.dao.abstract.js";

class DriverPostgresDAO extends DriverDAO {

    async createDriver({ name, phone }) {

        const result = await pool.query(
            `
            INSERT INTO delivery_drivers
            (
                name,
                phone
            )
            VALUES
            (
                $1,
                $2
            )
            RETURNING *
            `,
            [name, phone]
        );

        return result.rows[0];
    }
    async getDrivers() {

    const result = await pool.query(
        `
        SELECT *
        FROM delivery_drivers
        ORDER BY id
        `
    );

    return result.rows;
}
async getAssignmentByOrderId(orderId) {

    const result = await pool.query(
        `
        SELECT
            da.id,
            da.order_id,
            da.assigned_at,

            d.id AS driver_id,
            d.name AS driver_name,
            d.phone AS driver_phone,

            o.status AS order_status

        FROM delivery_assignments da

        INNER JOIN delivery_drivers d
            ON d.id = da.driver_id

        INNER JOIN orders o
            ON o.id = da.order_id

        WHERE da.order_id = $1
        `,
        [orderId]
    );

    return result.rows[0];
}
}

export default new DriverPostgresDAO();