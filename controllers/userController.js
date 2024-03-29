const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../utils/config');

const userController = {
    signup: async (req, res) => {
        try {
            // get the data from the request body : name, email, password
            const { name, email, password } = req.body;

            // check if the user already exists with the email
            const existingUser = await User.findOne({ email });

            if(existingUser){
                return res.status(409).json({ message: 'User already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            // create a new user 
            const newUser = new User({
                name, 
                email,
                password: hashedPassword
            });
            
            // store the user in the db
            await newUser.save();

            res.status(201).json({ message: 'User created successfully' });
        } catch(error){
            console.error('Error signing up user', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },
    getUserList: async (req, res) => {
        try {
            const userList = await User.find({}, 'name email');
            res.json(userList);
        } catch(error){
            console.error('Error getting user list', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    signin: async (req, res) => {
        try {
            // get the email, password from request body
            const { email, password } = req.body;

            // check if the user exists with the email
            const user = await User.findOne({ email });

            // throw an error if not
            if(!user){
                return res.status(401).json({ message: 'User not found' });
            }

            // if the user exists, get the password of the user from the database and compare
            const passwordMatch = await bcrypt.compare(password, user.password);

            // throw an error if the passwords do not match
            if(!passwordMatch){
                return res.status(401).json({ message: 'Wrong credentials' });
            }

            // else generate a token and send the jwt token
            const token = jwt.sign({ userId: user._id, name: user.name, email: user.email }, config.SECRET_KEY, { expiresIn: '1h' });
            res.json({ token });
        } catch(error){
            console.error('Error signing in user', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    getProfile: async (req, res) => {
        try {
            const userId = req.userId;
            const user = await User.findById(userId, 'name email');
            res.json(user);
        } catch(error){
            console.error('Error getting user profile', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    editProfile: async (req, res) => {
        try {
            const userId = req.userId;
            const { name, email } = req.body;

            const user = await User.findByIdAndUpdate(
                userId,
                { name, email, updatedAt: Date.now() },
                { new: true }
            );

            res.json({ message: 'Profile updated successfully' });
        } catch(error){
            console.error('Error updating user profile', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    deleteProfile: async (req, res) => {
        try {
            const userId = req.userId;
            await User.findByIdAndDelete(userId);
            res.json({ message: 'Profile deleted successfully' });
        } catch(error){
            console.error('Error deleting user profile', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}

module.exports = userController;