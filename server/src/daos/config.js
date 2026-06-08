import config from "../config/environment.js";

// POSTGRES (instancias)
import menuPostgresDAO from "./menu/menu.postgres.dao.js";
import reservationPostgresDAO from "./reservation/reservation.postgres.dao.js";
import orderPostgresDAO from "./orders/order.postgres.dao.js";

import userPostgresDAO from "./users/user.postgres.dao.js";
import restaurantPostgresDAO from "./restaurant/restaurant.postgres.dao.js";

import driverMongoDAO from "./drivers/driver.mongo.dao.js";
import driverPostgresDAO from "./drivers/driver.postgres.dao.js";




// MONGO (instancias)
import menuMongoDAO from "./menu/menu.mongo.dao.js";
import reservationMongoDAO from "./reservation/reservation.mongo.dao.js";
import orderMongoDAO from "./orders/order.mongo.dao.js";

import userMongoDAO from "./users/user.mongo.dao.js";
import restaurantMongoDAO from "./restaurant/restaurant.mongo.dao.js";



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
 export const driverDAO =
    dbType === "mongo"
        ? driverMongoDAO
        : driverPostgresDAO;