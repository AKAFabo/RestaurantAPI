class DriverService {

    constructor(driverDAO) {
        this.driverDAO = driverDAO;
    }

    async createDriver(driverData) {

        const driver =
            await this.driverDAO.createDriver(
                driverData
            );

        return { driver };
    }
    async getDrivers() {

    const drivers =
        await this.driverDAO.getDrivers();

    return { drivers };
}
async getAssignmentByOrderId(orderId) {

    const assignment =
        await this.driverDAO
            .getAssignmentByOrderId(orderId);

    return { assignment };
}
calculateDistance(lat1, lon1, lat2, lon2) {

    const R = 6371;

    const dLat =
        (lat2 - lat1) * Math.PI / 180;

    const dLon =
        (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) *
        Math.sin(dLat / 2)
        +
        Math.cos(lat1 * Math.PI / 180)
        *
        Math.cos(lat2 * Math.PI / 180)
        *
        Math.sin(dLon / 2)
        *
        Math.sin(dLon / 2);

    const c =
        2 * Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return R * c;
}
async getRoutes() {

    const routesData =
        await this.driverDAO.getRoutesData();

    const driversMap = {};

    for (const row of routesData) {

        if (!driversMap[row.driver_id]) {

            driversMap[row.driver_id] = {
                driverId: row.driver_id,
                driverName: row.driver_name,
                stops: []
            };
        }

        driversMap[row.driver_id].stops.push({
            orderId: row.order_id,
            latitude: Number(row.latitude),
            longitude: Number(row.longitude),
            address: row.address
        });
    }

    const routes = [];

    for (const driverId in driversMap) {

        const driver =
            driversMap[driverId];

        const optimizedRoute =
            this.buildNearestNeighborRoute(
                driver.stops
            );

        routes.push({
            driverId:
                driver.driverId,

            driverName:
                driver.driverName,

            stops:
                optimizedRoute
        });
    }

    return { routes };
}
buildNearestNeighborRoute(stops) {

    if (stops.length <= 1) {
        return stops;
    }

    const remaining =
        [...stops];

    const route = [];

    let current =
        remaining.shift();

    route.push(current);

    while (remaining.length > 0) {

        let nearestIndex = 0;

        let nearestDistance =
            this.calculateDistance(
                current.latitude,
                current.longitude,
                remaining[0].latitude,
                remaining[0].longitude
            );

        for (
            let i = 1;
            i < remaining.length;
            i++
        ) {

            const distance =
                this.calculateDistance(
                    current.latitude,
                    current.longitude,
                    remaining[i].latitude,
                    remaining[i].longitude
                );

            if (
                distance <
                nearestDistance
            ) {
                nearestDistance =
                    distance;

                nearestIndex = i;
            }
        }

        current =
            remaining.splice(
                nearestIndex,
                1
            )[0];

        route.push(current);
    }

    return route.map(
        (stop, index) => ({
            stop: index + 1,
            ...stop
        })
    );
}
}

export default DriverService;