import axios from "axios";
import dotenv from 'dotenv';
import userDAO from '../daos/users/user.postgres.Dao.js';
import restaurantDAO from '../daos/restaurant/restaurant.postgres.Dao.js';

dotenv.config();

const restaurantController = {

    async createRestaurant(req, res) {
        try {
            const { name, address, phone } = req.body;

            // Validar primero
            if (!name || !address || !phone) {
                return res.status(400).json({ error: 'Name, address and phone are required' });
            }

            const token = req.kauth?.grant?.access_token?.content;
            const email = token?.email;
            console.log('Token email:', email);
            const dbUser = await userDAO.getByEmail(email);

            if (!dbUser) {
                return res.status(404).json({ error: 'User not found' });
            }

            const newRestaurant = await restaurantDAO.createRestaurant({ name, address, phone, admin_id: dbUser.id });
            res.status(201).json(newRestaurant);
        } catch (error) {
            console.error('Error creating restaurant:', error);
            res.status(500).json({ error: 'Error creating restaurant' });
        }
    },
      
    async getRestaurants(req, res) {
        try {
            const restaurants = await restaurantDAO.getRestaurants();
            res.json(restaurants);
        } catch (error) {
            console.error('Error fetching restaurants:', error);
            res.status(500).json({ error: 'Error fetching restaurants' });
        }
        },

    async createMenu(req, res) {
        try {
            const { restaurantId } = req.params;
            const { name } = req.body;
            if (!name) {
                return res.status(400).json({ error: 'Menu name is required' });
            }
            const newMenu = await restaurantDAO.createMenu(restaurantId, { name });
            res.status(201).json(newMenu);
        } catch (error) {
            console.error('Error creating menu:', error);
            res.status(500).json({ error: 'Error creating menu' });
        }
    }
}

export default restaurantController;