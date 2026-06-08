import DriverDAO from "./driver.dao.abstract.js";

import DeliveryDriver from "../../models/deliveryDriver.model.js";
import UserLocation from "../../models/userLocation.model.js";
import Order from "../../models/order.Model.js";
import mongoose from "mongoose";

class DriverMongoDAO extends DriverDAO {

    async createDriver({ name, phone }) {

        const driver = await DeliveryDriver.create({
            name,
            phone,
            active: true,
            assignments: []
        });

        return driver;
    }

    async getDrivers() {

        return await DeliveryDriver.find()
            .lean();
    }
    async getAssignmentByOrderId(orderId) {

    const objectId =
    new mongoose.Types.ObjectId(orderId);

    const driver =
        await DeliveryDriver.findOne({
            "assignments.order_id": objectId
        }).lean();

    if (!driver) {
        return null;
    }

    const assignment =
        driver.assignments.find(
            a => a.order_id.toString() === orderId.toString()
        );

    const order =
        await Order.findById(orderId).lean();

    return {
        order_id: orderId,
        assigned_at: assignment.assigned_at,

        driver_id: driver._id,
        driver_name: driver.name,
        driver_phone: driver.phone,

        order_status: order?.status
    };
}
async getRoutesData() {

    const drivers =
        await DeliveryDriver.find({
            active: true
        }).lean();

    const routesData = [];

    for (const driver of drivers) {

        for (const assignment of driver.assignments) {

            const order =
                await Order.findById(
                    assignment.order_id
                ).lean();

            if (!order) {
                continue;
            }

            const location =
                await UserLocation.findOne({
                    user_id: order.user_id
                }).lean();

            if (!location) {
                continue;
            }

            routesData.push({
                driver_id: driver._id,
                driver_name: driver.name,

                order_id: order._id,

                latitude: location.latitude,
                longitude: location.longitude,
                address: location.address
            });
        }
    }

    return routesData;
}

}

export default new DriverMongoDAO();