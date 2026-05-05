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

        const user = await this.userDAO.registerUser(
            email,
            name,
            password
        )

        return { user };
    }

    async getByEmail(email){

        const user = await this.userDAO.getByEmail(email)
        return { user };
    }

    async updateUser(id, { email, name, password }){
        
        const user = await this.userDAO.updateUser(id, { email, name, password })
        return { user };
    }

    async deleteUser(id) {

        const user = await this.userDAO.deleteUser(id);
        return { user };
    }
}

export default UserService