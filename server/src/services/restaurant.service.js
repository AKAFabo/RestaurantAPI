class RestaurantService {
    constructor(restaurantDAO){
        this.restaurantDAO = restaurantDAO;
    }

    async createRestaurant({ name, address, phone, admin_id }){
        
        const restaurant = await this.restaurantDAO.createRestaurant({ name, address, phone, admin_id })
        return { restaurant };
    }

    async getRestaurants(){
        
        const restaurants = await this.restaurantDAO.getRestaurants()
        return { restaurants };
    }

    async createMenu(restaurantId, { name }){

        const menu = await this.restaurantDAO.createMenu(restaurantId, { name })
        return { menu };
    }
}

export default RestaurantService;