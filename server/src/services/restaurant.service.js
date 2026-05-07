import { invalidateRestaurantsCache } from "../middlewares/cacheHelper.js";

class RestaurantService {
    constructor(restaurantDAO){
        this.restaurantDAO = restaurantDAO;
    }

    async createRestaurant({ name, address, phone, admin_id, tables = [] }){
        
        const restaurant = await this.restaurantDAO.createRestaurant({ name, address, phone, admin_id, tables })
        await invalidateRestaurantsCache();
        return { restaurant };
    }

    async getRestaurants(){
        
        const restaurants = await this.restaurantDAO.getRestaurants()
        return { restaurants };
    }

    async createMenu(restaurantId, { name, products = [] }){

        const menu = await this.restaurantDAO.createMenu(restaurantId, { name, products })
        await invalidateRestaurantsCache();
        return { menu };
    }
}

export default RestaurantService;