import mongoose from "mongoose";
import Menu from "../../models/menu.Model.js";
import Order from "../../models/order.Model.js";
import OrderDAO from "./order.dao.abstract.js";

class MongoorderDAO extends OrderDAO {

    getById = async (id) => {

        const ObjectId = new mongoose.Types.ObjectId(id);

        const order = await Order.findById(ObjectId).lean();

        if (!order) {
            return null;
        }

        return order;
        };



    create = async ({ user_id, restaurant_id, reservation_id, items }) => {
        const userObjectId = new mongoose.Types.ObjectId(user_id);
        const restaurantObjectId = new mongoose.Types.ObjectId(restaurant_id);
        

         const reservationObjectId = reservation_id
          ? new mongoose.Types.ObjectId(reservation_id)
          : null;

        let total = 0;

        // validar items
        if (!Array.isArray(items) || items.length === 0) {
            throw new Error("Items inválidos");
        }

        const processedItems = [];

        for (const item of items) {

            if (!item.quantity || item.quantity <= 0) {
            throw new Error(`Cantidad inválida para producto ${item.product_id}`);
            }

            const productObjectId = new mongoose.Types.ObjectId(item.product_id);

            const menu = await Menu.findOne({
                restaurant_id: restaurantObjectId,
                "products._id": productObjectId
            });

            if (!menu) {
            throw new Error(`Producto ${item.product_id} no existe o no pertenece al restaurante`);
            }

            const product = menu.products.find(
            p => p._id.toString() === item.product_id.toString()
            );

            if (!product.available) {
            throw new Error(`Producto ${item.product_id} no disponible`);
            }

            total += product.price * item.quantity;

            processedItems.push({
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
}
export default new MongoorderDAO();