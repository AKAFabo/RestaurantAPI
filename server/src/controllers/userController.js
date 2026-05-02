import axios from 'axios';
import userDAO from '../daos/users/user.postgres.Dao.js';
import dotenv from 'dotenv';
import { updateKeycloakUser } from '../services/keycloakService.js';
import { deleteKeycloakUser } from '../services/keycloakService.js';

dotenv.config();
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://keycloak:8080';


const userController = {

    async getUsers(req, res) {  
        try {
            const users = await userDAO.getUsers();
            res.json(users);
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ error: 'Error fetching users' });
        }
    },
    
    async registerUser(req, res) {
        try {
            const { email, name, password } = req.body;

            if (!email || !name || !password) {
                return res.status(400).json({ error: 'Email, name and password are required' });
            }

            const newUser = await userDAO.registerUser({ email, name, password });
            res.status(201).json(newUser);
        } catch (error) {
            console.error('Error registering user:', error);
            res.status(500).json({ error: 'Error registering user' });
        }
    },

    async authUser(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }

            const response = await axios.post(
                `${KEYCLOAK_URL}/realms/restaurant-realm/protocol/openid-connect/token`,
                new URLSearchParams({
                    client_id: 'restaurant-api',
                    client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
                    grant_type: 'password',
                    username: email,
                    password: password,
                }),
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                }
            );
            res.json(response.data);

        } catch (error) {
            console.error('Error authenticating user:', error);
            res.status(401).json({ error: 'Invalid email or password' });
        }
    },

    async getMe(req, res) {
        try {  
            const token = req.kauth?.grant?.access_token?.content;
            const email = token?.email;
            const dbUser = await userDAO.getByEmail(email);

            if (!dbUser) {
                return res.status(404).json({ error: 'User not found in database' });
            }

            const userInfo = {
                email: dbUser.email,
                name: dbUser.name,
                id: dbUser.id,
                roles: token?.realm_access?.roles || [],
            };

            res.json(userInfo);
        } catch (error) {
            console.error('Error fetching user info:', error);
            res.status(500).json({ error: 'Error fetching user info' });
        }
    },

    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const { email, name, password } = req.body;

            if (!email || !name || !password) {
                return res.status(400).json({ error: 'Email, name and password are required' });
            }

            // Obtener el email actual del usuario desde PostgreSQL
            const currentUser = await userDAO.getUserById(id);
            if (!currentUser) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Buscar en Keycloak con el email actual, actualizar con los nuevos datos
            await updateKeycloakUser(currentUser.email, { email, name, password });
            const updatedUser = await userDAO.updateUser(id, { email, name, password });

            res.json(updatedUser);
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({ error: 'Error updating user' });
        }
    },

    async deleteUser(req, res) {
        try {
            const { id } = req.params;
            const user = await userDAO.getUserById(id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            await deleteKeycloakUser(user.email); // Eliminar usuario de Keycloak
            await userDAO.deleteUser(id);
            res.status(204).send();
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ error: error.response?.data || error.message });
        }
    }
};

export default userController;