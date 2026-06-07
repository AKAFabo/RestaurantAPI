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

}

export default DriverService;