import * as orderDAO from "../daos/orderDAO.js";

export const createOrder = async (req, res) => {
  try {

    //  Datos del body
    const { restaurant_id, reservation_id, items } = req.body;

    //  Usuario desde token
    const user = req.kauth?.grant?.access_token?.content;
    const user_id = user?.sub;

    //  Validaciones
    if (!restaurant_id || !items || items.length === 0) {
      return res.status(400).json({
        error: "restaurant_id e items son requeridos"
      });
    }

    if (!user_id) {
      return res.status(401).json({
        error: "Usuario no autenticado"
      });
    }

    //  DAO
    const order = await orderDAO.create({
      user_id,
      restaurant_id,
      reservation_id,
      items
    });

    res.status(201).json({
      message: "Pedido creado",
      order
    });

  } catch (error) {
    console.error("Error creando orden:", error);

    res.status(500).json({
      error: error.message || "Error creando pedido"
    });
  }
};
export const getOrderById = async (req, res) => {
  try {

    const { id } = req.params;

    //  usuario desde token
    const user = req.kauth?.grant?.access_token?.content;
    const user_id = user?.sub;

    //  roles
    const roles = user?.realm_access?.roles || [];

    if (!id) {
      return res.status(400).json({
        error: "ID requerido"
      });
    }

    const order = await orderDAO.getById(id);

    //  no existe
    if (!order) {
      return res.status(404).json({
        error: "Pedido no encontrado"
      });
    }

    //  validar  si no es admin
    if (!roles.includes("admin") && order.user_id !== user_id) {
      return res.status(403).json({
        error: "No tienes permiso para ver este pedido"
      });
    }

    //  respuesta
    res.json(order);

  } catch (error) {
    console.error("Error obteniendo pedido:", error);

    res.status(500).json({
      error: "Error obteniendo pedido"
    });
  }
};