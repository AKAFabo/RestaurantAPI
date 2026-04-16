import mongoose from "mongoose";
import Menu from "../models/menu.Model.js";
import Order from "../models/order.Model.js";
import OrderDAO from "./order.dao.abstract.js";

class MongoorderDAO extends OrderDAO {

    getById = async (id) => {

        const order = await Order.findById(id).lean();

        if (!order) {
            return null;
        }

        return order;
        };



    create = async ({ user_id, restaurant_id, reservation_id, items }) => {

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

            //  buscar producto dentro de menus
            const menu = await Menu.findOne({
            restaurant_id,
            "products._id": item.product_id
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

        //  crear orden (con items embebidos)
        const order = await Order.create({
            user_id,
            restaurant_id,
            reservation_id: reservation_id || null,
            status: "PENDING",
            total,
            items: processedItems
        });

        return order;
        };
}
export default new MongoorderDAO();