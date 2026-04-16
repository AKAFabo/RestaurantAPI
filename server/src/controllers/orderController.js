import { orderService } from "../services/config.js";

export const createOrder = async (req, res) => {
  try {

    const { restaurant_id, reservation_id, items } = req.body;

    const user = req.kauth?.grant?.access_token?.content;
    const email = user?.email;

    if (!restaurant_id || !items || items.length === 0) {
      return res.status(400).json({
        error: "restaurant_id e items son requeridos"
      });
    }

    if (!email) {
      return res.status(401).json({
        error: "Usuario no autenticado"
      });
    }

    const { error, order } = await orderService.createOrder({
      email,
      restaurant_id,
      reservation_id,
      items
    });

    if (error === "USER_NOT_FOUND") {
      return res.status(404).json({
        error: "Usuario no existe en la BD"
      });
    }

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

    const user = req.kauth?.grant?.access_token?.content;
    const email = user?.email;
    const roles = user?.realm_access?.roles || [];

    if (!id) {
      return res.status(400).json({
        error: "ID requerido"
      });
    }

    if (!email) {
      return res.status(401).json({
        error: "Usuario no autenticado"
      });
    }

    const { error, order } = await orderService.getOrderById({
      id,
      email,
      roles
    });

    if (error === "USER_NOT_FOUND") {
      return res.status(404).json({
        error: "Usuario no existe en la BD"
      });
    }

    if (error === "ORDER_NOT_FOUND") {
      return res.status(404).json({
        error: "Pedido no encontrado"
      });
    }

    if (error === "FORBIDDEN") {
      return res.status(403).json({
        error: "No tienes permiso para ver este pedido"
      });
    }

    res.json(order);

  } catch (error) {
    console.error("Error obteniendo pedido:", error);

    res.status(500).json({
      error: "Error obteniendo pedido"
    });
  }
};