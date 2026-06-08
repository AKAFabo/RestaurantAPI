import mongoose from "mongoose";
import Menu from "../../models/menu.Model.js";
import Order from "../../models/order.Model.js";
import OrderDAO from "./order.dao.abstract.js";
import DeliveryDriver from "../../models/deliveryDriver.model.js";

class MongoorderDAO extends OrderDAO {

    getById = async (id) => {

        const ObjectId = new mongoose.Types.ObjectId(id); // transforma al tipo adecuado

        const order = await Order.findById(ObjectId).lean(); // busca con el id 

        if (!order) { // si no hay orden regresa nulo 
            return null;
        }

        return order;
        };



    create = async ({ user_id, restaurant_id, reservation_id, items }) => {
       // convierte los ids 
        const userObjectId = new mongoose.Types.ObjectId(user_id);
        const restaurantObjectId = new mongoose.Types.ObjectId(restaurant_id);
        
        // en caso de que no haya reservacion 
         const reservationObjectId = reservation_id
          ? new mongoose.Types.ObjectId(reservation_id)
          : null;

        let total = 0;

        // validar items
        if (!Array.isArray(items) || items.length === 0) {
            throw new Error("Items inválidos");
        }

        const processedItems = [];

        for (const item of items) {// reccorre el array de items 

            if (!item.quantity || item.quantity <= 0) {
            throw new Error(`Cantidad inválida para producto ${item.product_id}`);
            }

            const productObjectId = new mongoose.Types.ObjectId(item.product_id); // convierte el id 

            const menu = await Menu.findOne({ // busca el producto en el menu 
                restaurant_id: restaurantObjectId,
                "products._id": productObjectId
            });

            if (!menu) { // verifica que sea un producto del restaurante asociado 
            throw new Error(`Producto ${item.product_id} no existe o no pertenece al restaurante`);
            }

            const product = menu.products.find(
            p => p._id.toString() === item.product_id.toString()
            );

            if (!product.available) {
            throw new Error(`Producto ${item.product_id} no disponible`);
            }

            total += product.price * item.quantity; // calculo de total 

            processedItems.push({ // se guarda los datos de items 
            product_id: product._id,
            name: product.name, //  
            quantity: item.quantity,
            price: product.price
            });
        }

        //  crear orden 
        const order = await Order.create({
        user_id: userObjectId,
        restaurant_id: restaurantObjectId,
        reservation_id: reservationObjectId || null,
        status: "PENDING",
        total,
        items: processedItems
            });

        return order;
        };
    async assignDrivers() {

    const drivers = await DeliveryDriver.find({
        active: true
    });

    if (drivers.length === 0) {
        throw new Error(
            "No active drivers available"
        );
    }

    const assignedOrderIds = new Set();

    drivers.forEach(driver => {

        driver.assignments.forEach(
            assignment => {

                assignedOrderIds.add(
                    assignment.order_id.toString()
                );

            }
        );

    });

    const pendingOrders = await Order.find({
        status: "PENDING",
        _id: {
            $nin: [...assignedOrderIds]
        }
    });

    const assignments = [];

    let driverIndex = 0;

    for (const order of pendingOrders) {

        const driver =
            drivers[driverIndex];

        const assignment = {
            order_id: order._id,
            assigned_at: new Date()
        };

        driver.assignments.push(
            assignment
        );

        await driver.save();

        assignments.push({
            order_id: order._id,
            driver_id: driver._id,
            assigned_at: assignment.assigned_at
        });

        driverIndex++;

        if (driverIndex >= drivers.length) {
            driverIndex = 0;
        }
    }

    return assignments;
}
}
export default new MongoorderDAO();