import { orderService } from "../services/config.js";
import os from "os";

export const createOrder = async (req, res) => {
  console.log(" API  desde:", os.hostname());
  try {

    const { restaurant_id, reservation_id, items } = req.body; // obtiene los paramentros del body

    const user = req.kauth?.grant?.access_token?.content;
    const email = user?.email; // extrae el email del usuario autenticado

    if (!restaurant_id || !items || items.length === 0) { // valida que vengan los datos
      return res.status(400).json({
        error: "restaurant_id e items son requeridos"
      });
    }

    if (!email) {// verifica que venga el email 
      return res.status(401).json({
        error: "Usuario no autenticado"
      });
    }

    const { error, order } = await orderService.createOrder({ // llama al service
      email,
      restaurant_id,
      reservation_id,
      items
    });
    // verifica si se devolvio algun error
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


export const getOrderById = async (req, res) => { // obtener una orden por su id 
  console.log(" API  desde:", os.hostname());
  try {

    const { id } = req.params; // obtiene el id del url
    // obtiene la informacion del usuario autenticado
    const user = req.kauth?.grant?.access_token?.content;
    const email = user?.email;
    const roles = user?.realm_access?.roles || [];

    // valida que vengan los datos 
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

    const { error, order } = await orderService.getOrderById({ // llama al service con los datos 
      id,
      email,
      roles
    });
    // verifica si devolvio algun error
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

    res.json(order); // si no hubo erro devuelve la info de la orden 

  } catch (error) {
    console.error("Error obteniendo pedido:", error);

    res.status(500).json({
      error: "Error obteniendo pedido"
    });
  }
};