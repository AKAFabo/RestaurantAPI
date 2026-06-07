import {
    invalidateUsersCache,
    invalidateUserCache
} from '../middlewares/cacheHelper.js'

class UserService {
    constructor(userDAO) {
        this.userDAO = userDAO;
    }

    async getUserById(id) {

        const user = await this.userDAO.getUserById(id)
        return { user } ;
    }

    async getUsers() {

        const users = await this.userDAO.getUsers();
        return { users };
    }

    async registerUser({ email, name, password }) {

        const user = await this.userDAO.registerUser({
            email,
            name,
            password
        })

        await invalidateUsersCache();

        return { user };
    }

    async getByEmail(email){

        const user = await this.userDAO.getByEmail(email)
        return { user };
    }

    async updateUser(id, { email, name, password }){
        
        const user = await this.userDAO.updateUser(id, { email, name, password })

        await invalidateUserCache(id); //Invalidar, ruta PUT
        await invalidateUsersCache();

        return { user };
    }

    async deleteUser(id) {

        const user = await this.userDAO.deleteUser(id);

        await invalidateUsersCache();
        await invalidateUserCache(id);

        return { user };
    }
    async saveLocation(userId, locationData) {

    const location =
        await this.userDAO.saveLocation(
            userId,
            locationData
        );

    return { location };
}
async getLocation(userId) {

    const location =
        await this.userDAO.getLocation(userId);

    return { location };
}
}

export default UserService