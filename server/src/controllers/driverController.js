import { driverService } from "../services/config.js";

const driverController = {

    async createDriver(req, res) {

        try {

            const {
                name,
                phone
            } = req.body;

            if (!name) {

                return res.status(400).json({
                    error: "Driver name is required"
                });
            }

            const driver =
                await driverService.createDriver({
                    name,
                    phone
                });

            res.status(201).json(driver);

        } catch (error) {

            console.error(
                "Error creating driver:",
                error
            );

            res.status(500).json({
                error: "Error creating driver"
            });
        }
    },
    async getDrivers(req, res) {

    try {

        const drivers =
            await driverService.getDrivers();

        res.json(drivers);

    } catch (error) {

        console.error(
            "Error fetching drivers:",
            error
        );

        res.status(500).json({
            error: "Error fetching drivers"
        });
    }
},
async getAssignmentByOrderId(req, res) {

    try {

        const { orderId } = req.params;

        const assignment =
            await driverService
                .getAssignmentByOrderId(orderId);

        if (!assignment.assignment) {

            return res.status(404).json({
                error: "Assignment not found"
            });
        }

        res.json(assignment);

    } catch (error) {

        console.error(
            "Error getting assignment:",
            error
        );

        res.status(500).json({
            error: "Error getting assignment"
        });
    }
},
async getRoutes(req, res) {

    try {

        const routes =
            await driverService.getRoutes();

        res.json(routes);

    } catch (error) {

        console.error(
            "Error getting routes:",
            error
        );

        res.status(500).json({
            error: "Error getting routes"
        });
    }
}
};

export default driverController;