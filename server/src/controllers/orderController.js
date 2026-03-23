
import * as orderDAO from "../daos/orderDao.js";
import * as userDAO from "../daos/reservationDao.js";

export const createOrder = async (req, res) => {
  try {

    const { restaurant_id, reservation_id, items } = req.body; // paremetros del body

    const user = req.kauth?.grant?.access_token?.content;  // obtiene el id de key 
    const email = user?.email; // obtiene el email del token 

    // validaciones de los parametros requeridos
    if (!restaurant_id || !items || items.length === 0) {
      return res.status(400).json({
        error: "restaurant_id e items son requeridos"
      });
    }

    if (!email) { // verifica que el  usuario este en keycloak
      return res.status(401).json({
        error: "Usuario no autenticado"
      });
    }

    //  buscar usuario en BD
    const dbUser = await userDAO.getByEmail(email); // obtiene el id del user de la db por medio del email 

    if (!dbUser) { // validacion de usuariok
      return res.status(404).json({
        error: "Usuario no existe en la BD"
      });
    }

    const order = await orderDAO.create({ // llamada al dao 
      user_id: dbUser.id, //  usa el id de la db para crear la orden 
      restaurant_id,
      reservation_id,
      items
    });

    res.status(201).json({
      message: "Pedido creado",
      order // muestra la orden 
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

    const { id } = req.params; // parametro

    const user = req.kauth?.grant?.access_token?.content; // user de key 
    const email = user?.email; // email de key 

    const roles = user?.realm_access?.roles || []; // obtener el rol que tiene el user
    // validaciones de params
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

    //  obtener usuario REAL de la BD
    const dbUser = await userDAO.getByEmail(email);

    if (!dbUser) {
      return res.status(404).json({
        error: "Usuario no existe en la BD"
      });
    }

    const order = await orderDAO.getById(id); // se obtiene la orden 

    if (!order) {
      return res.status(404).json({
        error: "Pedido no encontrado"
      });
    }

    
    if (!roles.includes("admin") && order.user_id !== dbUser.id) { // verifica los permisos del user 
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