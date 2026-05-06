class OrderService {
  constructor(orderDAO, reservationDAO) { // hace la inyeccion de dependencias
    this.orderDAO = orderDAO;
    this.reservationDAO = reservationDAO; 
  }

  async createOrder({ email, restaurant_id, reservation_id, items }) {

    // buscar usuario
    const dbUser = await this.reservationDAO.getByEmail(email);  

    if (!dbUser) {
      return { error: "USER_NOT_FOUND" };
    }

    const order = await this.orderDAO.create({// le envia al dao los datos
      user_id: dbUser.id,
      restaurant_id,
      reservation_id,
      items
    });

    return { order };// regresa la orden creada
  }


  async getOrderById({ id, email, roles }) {

    const dbUser = await this.reservationDAO.getByEmail(email); // verfica que si exista el usuario 

    if (!dbUser) {
      return { error: "USER_NOT_FOUND" };
    }

    const order = await this.orderDAO.getById(id); // obtiene la orden 

    if (!order) {
      return { error: "ORDER_NOT_FOUND" };
    }

    // verifica si tiene el permiso para verla 
    if (
      !roles.includes("admin") &&
      order.user_id.toString() !== (dbUser._id || dbUser.id).toString()
    ) {
      return { error: "FORBIDDEN" };
    }

    return { order };
  }
}

export default OrderService;