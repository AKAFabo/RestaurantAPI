import config from "../config/environment.js";

// POSTGRES (instancias)
import menuPostgresDAO from "./menu.postgres.dao.js";
import reservationPostgresDAO from "./reservation.postgres.dao.js";
import orderPostgresDAO from "./order.postgres.dao.js";

import userPostgresDAO from "./user.postgres.dao.js";
import restaurantPostgresDAO from "./restaurant.postgres.dao.js";



// MONGO (instancias)
import menuMongoDAO from "./menu.mongo.dao.js";
import reservationMongoDAO from "./reservation.mongo.dao.js";
import orderMongoDAO from "./order.mongo.dao.js";

import userMongoDAO from "./user.mongo.dao.js";
import restaurantMongoDAO from "./restaurant.mongo.dao.js";



// ÚNICO punto donde se decide qué DAO usar según la configuración de la base de datos.
const dbType = config.database.type;

export const menuDAO =
  dbType === "mongo" ? menuMongoDAO : menuPostgresDAO;

export const reservationDAO =
  dbType === "mongo" ? reservationMongoDAO : reservationPostgresDAO;

export const orderDAO =
  dbType === "mongo" ? orderMongoDAO : orderPostgresDAO;

export const userDAO =
  dbType === "mongo" ? userMongoDAO : userPostgresDAO; 

export const restaurantDAO =
  dbType === "mongo" ? restaurantMongoDAO : restaurantPostgresDAO;