import axios from "axios";
import dotenv from 'dotenv';

import userDAO from '../daos/users/user.postgres.dao.js';
import { userService } from "../services/config.js";
import { restaurantService } from "../services/config.js";
//import restaurantDAO from '../daos/restaurantDao.js';


dotenv.config();

const restaurantController = {

    async createRestaurant(req, res) {
        try {
            const { name, address, phone, tables } = req.body;

            // Validar primero
            if (!name || !address || !phone) {
                return res.status(400).json({ error: 'Name, address and phone are required' });
            }

            const token = req.kauth?.grant?.access_token?.content;
            const email = token?.email;
            //console.log('Token email:', email);
            const dbUser = await userService.getByEmail(email);
            console.log('ID: ', dbUser.user.id)

            if (!dbUser) {
                return res.status(404).json({ error: 'User not found' });
            }

            const newRestaurant = await restaurantService.createRestaurant({ name, address, phone, admin_id: dbUser.user.id, tables });
            res.status(201).json(newRestaurant);
        } catch (error) {
            console.error('Error creating restaurant:', error);
            res.status(500).json({ error: 'Error creating restaurant' });
        }
    },
      
    async getRestaurants(req, res) {
        try {
            const restaurants = await restaurantService.getRestaurants();
            res.json(restaurants);
        } catch (error) {
            console.error('Error fetching restaurants:', error);
            res.status(500).json({ error: 'Error fetching restaurants' });
        }
        },

    async createMenu(req, res) {
        try {
            const { restaurantId } = req.params;
            const { name, products } = req.body;
            if (!name) {
                return res.status(400).json({ error: 'Menu name is required' });
            }
            const newMenu = await restaurantService.createMenu(restaurantId, { name, products });
            res.status(201).json(newMenu);
        } catch (error) {
            console.error('Error creating menu:', error);
            res.status(500).json({ error: 'Error creating menu' });
        }
    }
}

export default restaurantController;