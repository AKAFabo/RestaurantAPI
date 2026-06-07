class OrderDAO {

  async create({ user_id, restaurant_id, reservation_id, items }) {
    throw new Error("Method create not implemented");
  }

  async getById(id) {
    throw new Error("Method getById not implemented");
  }
  async assignDrivers() {
    throw new Error("Method assignDrivers not implemented");
}

}

export default OrderDAO;