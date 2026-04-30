import { menuDAO, reservationDAO, orderDAO } from "../daos/config.js";

import MenuService from "./menu.service.js";
import ReservationService from "./reservation.service.js";
import OrderService from "./order.service.js";

// inyeccion de dependencias 
export const menuService = new MenuService(menuDAO);
export const reservationService = new ReservationService(reservationDAO);
export const orderService = new OrderService(orderDAO, reservationDAO);   /// hay que cambiar por el dao de user 