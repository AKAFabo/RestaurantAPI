import config from "../config/environment.js";

// POSTGRES (instancias)
import menuPostgresDAO from "./menuDao.js";
import reservationPostgresDAO from "./reservationDao.js";
import orderPostgresDAO from "./orderDao.js";

// MONGO (instancias)
import menuMongoDAO from "./menu.mongo.dao.js";
import reservationMongoDAO from "./reservation.mongo.dao.js";
import orderMongoDAO from "./order.mongo.dao.js";

const dbType = config.database.type;

//  ÚNICO punto donde 
export const menuDAO =
  dbType === "mongo" ? menuMongoDAO : menuPostgresDAO;

export const reservationDAO =
  dbType === "mongo" ? reservationMongoDAO : reservationPostgresDAO;

export const orderDAO =
  dbType === "mongo" ? orderMongoDAO : orderPostgresDAO;