import userDAO from '../daos/userDao.js';

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

            const user = await userDAO.authUser(email, password);

            if (!user) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            res.json(user);
        } catch (error) {
            console.error('Error authenticating user:', error);
            res.status(500).json({ error: 'Error authenticating user' });
        }
    }
};

export default userController;