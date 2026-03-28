import { pool } from "../config/database.js"

const restaurantDAO = {

    async createRestaurant({ name, address, phone, admin_id }) {
        try {
            const result = await pool.query(
                'INSERT INTO restaurants (name, address, phone, admin_id) VALUES ($1, $2, $3, $4) RETURNING *',
                [name, address, phone, admin_id]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error creating restaurant:', error);
            throw error;
        }
    },

    async getRestaurants() {
        try {
            const result = await pool.query('SELECT * FROM restaurants');
            return result.rows;
        }
        catch (error) {
            console.error('Error fetching restaurants:', error);
            throw error;
        }       
    },

    async createMenu (restaurantId, { name }) {
        try {
            const result = await pool.query(
                'INSERT INTO menus (restaurant_id, name) VALUES ($1, $2) RETURNING *',  
                [restaurantId, name]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error creating menu:', error);
            throw error;
        }
    }
}

export default restaurantDAO;
