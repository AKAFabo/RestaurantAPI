import RestaurantDAO from "./restaurant.dao.abstract.js";
import Restaurant from "../../models/restaurant.model.js";
import Menu from "../../models/menu.Model.js";

class RestaurantMongoDAO extends RestaurantDAO {

    async createRestaurant({ name, address, phone, admin_id }) {
        try {
            const restaurant = await Restaurant.create({
                name,
                address,
                phone,
                admin_id
            });

            return restaurant;
        } catch (error) {
            console.error('Error creating restaurant:', error);
            throw error;
        }
    }

    async getRestaurants() {
        try {
            const restaurants = await Restaurant.find();
            return restaurants;
        } catch (error) {
            console.error('Error fetching restaurants:', error);
            throw error;
        }
    }

    async createMenu(restaurantId, { name }) {
        try {
            const menu = await Menu.create({
                restaurant_id: restaurantId,
                name,
                products: [] // inicial vacío
            });

            return menu;
        } catch (error) {
            console.error('Error creating menu:', error);
            throw error;
        }
    }
}

export default new RestaurantMongoDAO();