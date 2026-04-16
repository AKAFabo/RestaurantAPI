class OrderService {
  constructor(orderDAO, userDAO) {
    this.orderDAO = orderDAO;
    this.userDAO = userDAO;
  }

  async createOrder({ email, restaurant_id, reservation_id, items }) {

    // buscar usuario
    const dbUser = await this.userDAO.getByEmail(email);

    if (!dbUser) {
      return { error: "USER_NOT_FOUND" };
    }

    const order = await this.orderDAO.create({
      user_id: dbUser.id,
      restaurant_id,
      reservation_id,
      items
    });

    return { order };
  }


  async getOrderById({ id, email, roles }) {

    const dbUser = await this.userDAO.getByEmail(email);

    if (!dbUser) {
      return { error: "USER_NOT_FOUND" };
    }

    const order = await this.orderDAO.getById(id);

    if (!order) {
      return { error: "ORDER_NOT_FOUND" };
    }

    // permisos
    if (!roles.includes("admin") && order.user_id !== dbUser.id) {
      return { error: "FORBIDDEN" };
    }

    return { order };
  }
}

export default OrderService;