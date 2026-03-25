import { pool } from "../config/database.js";
import { createKeycloakUser } from "../services/keycloakService.js";
import crypto from "crypto";

const userDAO = {

    async getUsers() {
        try {

            const result = await pool.query('SELECT * FROM users');
            return result.rows;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }   
    },

    async registerUser({ email, name, password }) {
        try {

            await createKeycloakUser({ email, name, password }); // Keycloak user creation
            const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');         

            const result = await pool.query(
                'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING *',
                [email, name, hashedPassword]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error registering user:', error);
            throw error;
        }
    },

    async getByEmail(email) {
        try {
            const result = await pool.query(
                'SELECT * FROM users WHERE email = $1',
                [email]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error fetching user by email:', error);
            throw error;
        }
    }
}

export default userDAO;