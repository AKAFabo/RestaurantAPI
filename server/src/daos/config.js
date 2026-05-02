import config from "../config/environment.js";

// POSTGRES (instancias)
import menuPostgresDAO from "./menu/menu.postgres.Dao.js";
import reservationPostgresDAO from "./reservation/reservation.postgres.Dao.js";
import orderPostgresDAO from "./orders/order.postgres.Dao.js";

// MONGO (instancias)
import menuMongoDAO from "./menu/menu.mongo.dao.js";
import reservationMongoDAO from "./reservation/reservation.mongo.dao.js";
import orderMongoDAO from "./orders/order.mongo.dao.js";

const dbType = config.database.type;

//  ÚNICO punto donde 
export const menuDAO =
  dbType === "mongo" ? menuMongoDAO : menuPostgresDAO;

export const reservationDAO =
  dbType === "mongo" ? reservationMongoDAO : reservationPostgresDAO;

export const orderDAO =
  dbType === "mongo" ? orderMongoDAO : orderPostgresDAO;