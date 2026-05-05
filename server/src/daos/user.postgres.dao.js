import { pool } from "../config/database.js";
import { createKeycloakUser } from "../services/keycloakService.js";
import crypto from "crypto";
import UserDAO from "./user.dao.abstract.js";

class UserPostgresDAO extends UserDAO {

    async getUserById(id) {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0];
    }

    async getUsers() {
        try {

            const result = await pool.query('SELECT * FROM users');
            return result.rows;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }   
    }

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
    }

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

    async updateUser(id, { email, name, password }) {
        try {
            const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
            const result = await pool.query(
                'UPDATE users SET email = $1, name = $2, password_hash = $3 WHERE id = $4 RETURNING *',
                [email, name, hashedPassword, id]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }  
    } 

    async deleteUser(id) {
        try {
            await pool.query('DELETE FROM users WHERE id = $1', [id]);
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }
}

export default new UserPostgresDAO();



//NOT USED AT THE MOMENT
/*
const userDAO = {

    async getUserById(id) {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0];
    },

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
    },

    async updateUser(id, { email, name, password }) {
        try {
            const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
            const result = await pool.query(
                'UPDATE users SET email = $1, name = $2, password_hash = $3 WHERE id = $4 RETURNING *',
                [email, name, hashedPassword, id]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }  
    },

    async deleteUser(id) {
        try {
            await pool.query('DELETE FROM users WHERE id = $1', [id]);
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }
}

export default userDAO;
*/