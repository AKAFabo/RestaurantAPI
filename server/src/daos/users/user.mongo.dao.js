import User from "../../models/user.Model.js";
import crypto from "crypto";
import { createKeycloakUser } from "../../services/keycloakService.js";
import UserDAO from './user.dao.abstract.js'
import mongoose from "mongoose";
import UserLocation from "../../models/userLocation.model.js";

class UserMongoDAO extends UserDAO {

    async getUserById(id) {
        try {
            return await User.findById(id);
        } catch (error) {
            console.error('Error fetching user by id:', error);
            throw error;
        }
    }

    async getUsers() {
        try {
            return await User.find();
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    }

    async registerUser({ email, name, password}) {
        try {
            // Crear usuario en Keycloak
           // await createKeycloakUser({ email, name, password });

            // Hash SHA-256 (igual que en Postgres)
            const hashedPassword = crypto
                .createHash('sha256')
                .update(password)
                .digest('hex');

            const newUser = new User({
                email,
                name,
                password_hash: hashedPassword
            });

            return await newUser.save();
        } catch (error) {
            console.error('Error registering user:', error);
            throw error;
        }
    }

    async getByEmail(email) {
        try {
            return await User.findOne({ email });
        } catch (error) {
            console.error('Error fetching user by email:', error);
            throw error;
        }
    }

    async updateUser(id, { email, name, password, role_id }) {
        try {
            const updateData = {
                email,
                name,
                role_id
            };

            if (password) {
                updateData.password_hash = crypto
                    .createHash('sha256')
                    .update(password)
                    .digest('hex');
            }

            return await User.findByIdAndUpdate(
                id,
                updateData,
                { new: true } // equivalente a RETURNING *
            );

        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    async deleteUser(id) {
        try {
            await User.findByIdAndDelete(id);
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }
    async saveLocation(
    userId,
    {
        latitude,
        longitude,
        address
    }
) {

    const objectId =
        new mongoose.Types.ObjectId(userId);

    const location =
        await UserLocation.findOneAndUpdate(
            {
                user_id: objectId
            },
            {
                latitude,
                longitude,
                address
            },
            {
                upsert: true,
                new: true
            }
        );

    return location;
}
async getLocation(userId) {

    const objectId =
        new mongoose.Types.ObjectId(userId);

    return await UserLocation.findOne({
        user_id: objectId
    }).lean();
}
}

export default new UserMongoDAO();