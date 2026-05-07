import { pool } from "../../config/database.js"
import RestaurantDAO from "./restaurant.dao.abstract.js"

class RestaurantPostgresDAO extends RestaurantDAO {

    async createRestaurant({ name, address, phone, admin_id, tables = [] }) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const result = await client.query(
                'INSERT INTO restaurants (name, address, phone, admin_id) VALUES ($1, $2, $3, $4) RETURNING *',
                [name, address, phone, admin_id]
            );

            const restaurant = result.rows[0];

            // insertar mesas si vienen
            if (tables.length > 0) {
                for (const table of tables) {
                    await client.query(
                        'INSERT INTO tables (restaurant_id, table_number, capacity) VALUES ($1, $2, $3)',
                        [restaurant.id, table.table_number, table.capacity]
                    );
                }
            }

            await client.query('COMMIT');

            return restaurant;

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error creating restaurant:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    async getRestaurants() {
        try {
            const result = await pool.query('SELECT * FROM restaurants');
            return result.rows;
        }
        catch (error) {
            console.error('Error fetching restaurants:', error);
            throw error;
        }       
    }

    async createMenu(restaurantId, { name, products = [] }) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const result = await client.query(
                'INSERT INTO menus (restaurant_id, name) VALUES ($1, $2) RETURNING *',
                [restaurantId, name]
            );

            const menu = result.rows[0];

            // insertar productos
            if (products.length > 0) {
                for (const product of products) {
                    await client.query(
                        `INSERT INTO products 
                        (menu_id, name, description, category, price, available)
                        VALUES ($1, $2, $3, $4, $5, $6)`,
                        [
                            menu.id,
                            product.name,
                            product.description || "Producto sin descripción",
                            product.category,
                            product.price,
                            product.available ?? true
                        ]
                    );
                }
            }

            await client.query('COMMIT');

            return menu;

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error creating menu:', error);
            throw error;
        } finally {
            client.release();
        }
    }
}

export default new RestaurantPostgresDAO();




/*
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
*/