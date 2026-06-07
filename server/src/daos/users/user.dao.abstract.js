class UserDAO {

    async getUserById(id) {
    throw new Error("Method getUserById not implemented");
  }

  async getUsers() {
    throw new Error("Method getUsers not implemented");
  }

  async registerUser(email, name, password) {
    throw new Error("Method registerUser not implemented");
  }

  async getByEmail(email) {
    throw new Error("Method getByEmail not implemented");
  }

  async updateUser(id, { email, name, password }) {
    throw new Error("Method updateUser implemented");
  }

  async deleteUser(id) {
    throw new Error("Method deleteUser implemented");
  }
  async saveLocation(userId, { latitude, longitude, address }) {
  throw new Error("Method saveLocation not implemented");
}
async getLocation(userId) {
  throw new Error("Method getLocation not implemented");
}

}

export default UserDAO;