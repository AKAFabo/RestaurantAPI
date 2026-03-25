import axios from 'axios';
import userDAO from '../daos/userDao.js';
import dotenv from 'dotenv';

dotenv.config();


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
                `http://localhost:8080/realms/restaurant-realm/protocol/openid-connect/token`,
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
    }
};

export default userController;