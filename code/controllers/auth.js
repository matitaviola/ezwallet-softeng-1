import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
import { verifyAuth } from './utils.js';

/**
 * Register a new user in the system
  - Request Body Content: An object having attributes `username`, `email` and `password`
  - Response `data` Content: A message confirming successful insertion
  - Optional behavior:
    - error 400 is returned if there is already a user with the same username and/or email
 */
export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        //Check if all the neccessary atributes are contained
        if(!username || !email || !password){
            return res.status(400).json({ error: "All attributes are required" });
        }
        
        //Check if any parameter is an empty string
        //whitespaces are also considered empty string
        if(username.trim() === "" || email.trim() ==="" ||  password.trim() ===""){
            return res.status(400).json({ error: "Parameters cannot be empty" }); 
        }

        //Check if email is in valid format
        // Check if the email is in a valid format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

        /*
        //Email already registred
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser){
            res.status(400).json({ error: "Email already registered" });
            return;
        }   
             //username already registred
        const existingUsername = await User.findOne({username:req.body.username});
        if(existingUsername) return res.status(400).json({error:"Username already taken ! "});
        */
        const existingUser = await User.findOne({ email: req.body.email });
        
    
        const existingUsername = await User.findOne({username:req.body.username});
        
        if (existingUser || existingUsername){
            return res.status(400).json({ error: "Email/Username already registered" });
            
        }   


        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
        });
        res.status(200).json({data: {message:"User registred successfully."}});
    } catch (err) {
        res.status(400).json(err);
    }
}

/**
 * Register a new user in the system with an Admin role
  - Request Body Content: An object having attributes `username`, `email` and `password`
  - Response `data` Content: A message confirming successful insertion
  - Optional behavior:
    - error 400 is returned if there is already a user with the same username and/or email
 */
export const registerAdmin = async (req, res) => {
    try {
        const { username, email, password } = req.body
        
        //Check if all the neccessary atributes are contained
         if(!username || !email || !password){
            return res.status(400).json({ error: "All attributes are required" });
        }
        
        //Check if any parameter is an empty string
        //whitespaces are also considered empty string
        if(username.trim() === "" || email.trim() ==="" ||  password.trim() ===""){
            return res.status(400).json({ error: "Parameters cannot be empty" }); 
        }

       
        // Check if the email is in a valid format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

        /*
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) return res.status(400).json({ error: "Email already registered" });
        
        const existingUsername = await User.findOne({username:req.body.username});
        if(existingUsername) return res.status(400).json({error:"Username already taken ! "});
        */
        const existingUser = await User.findOne({ email: req.body.email });
        const existingUsername = await User.findOne({username:req.body.username});
        if (existingUser || existingUsername){
            return res.status(400).json({ error: "Email/Username already registered" });
            
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            role: "Admin"
        });
        res.status(200).json({data : {message :'Admin added succesfully'}});
    } catch (err) {
        res.status(500).json(err);
    }

}

/**
 * Perform login 
  - Request Body Content: An object having attributes `email` and `password`
  - Response `data` Content: An object with the created accessToken and refreshToken
  - Optional behavior:
    - error 400 is returned if the user does not exist
    - error 400 is returned if the supplied password does not match with the one in the database
 */
export const login = async (req, res) => {
    const { email, password } = req.body
    const cookie = req.cookies;

    //Check if all the neccessary atributes are contained
     if(!email || !password){
        return res.status(400).json({ error: "All attributes are required" });
    }
        
        //Check if any parameter is an empty string
        //whitespaces are also considered empty string
    if(email.trim() ==="" ||  password.trim() ===""){
        return res.status(400).json({ error: "Parameters cannot be empty" }); 
    }

       
        // Check if the email is in a valid format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
    }


    const existingUser = await User.findOne({ email: email })
    if (!existingUser) return res.status(400).json({error : 'please you need to register'})
    try {
        const match = await bcrypt.compare(password, existingUser.password)
        //console.log("The match bycrypt compare result : \t"+match)
        //console.log("the password req.body.password: \t" + req.body.password)
        //console.log("The existing user password: \t" + existingUser.password)
        //const hashedPassword = await bcrypt.hash(password, 12)
        //console.log("The bycrypt.hash(req.body.password,12) result: " + hashedPassword)
        //const hashedPassword1 = await bcrypt.hash(existingUser.password,12)
        //console.log("The bycrypt.hash(rexisitingUser.password,12) result: " + hashedPassword1)
        if (!match) return res.status(400).json({error:'wrong credentials'})
        //console.log("passed the condition")

        //CREATE ACCESSTOKEN
        const accessToken = jwt.sign({
            email: existingUser.email,
            id: existingUser.id,
            username: existingUser.username,
            role: existingUser.role
        }, process.env.ACCESS_KEY, { expiresIn: '1h' })
        //CREATE REFRESH TOKEN
        const refreshToken = jwt.sign({
            email: existingUser.email,
            id: existingUser.id,
            username: existingUser.username,
            role: existingUser.role
        }, process.env.ACCESS_KEY, { expiresIn: '7d' })
        //SAVE REFRESH TOKEN TO DB
        existingUser.refreshToken = refreshToken
        const savedUser = await existingUser.save()
        res.cookie("accessToken", accessToken, { httpOnly: true, domain: "localhost", path: "/api", maxAge: 60 * 60 * 1000, sameSite: "none", secure: true })
        res.cookie('refreshToken', refreshToken, { httpOnly: true, domain: "localhost", path: '/api', maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'none', secure: true })
        res.status(200).json({ data: { accessToken: accessToken, refreshToken: refreshToken }})
    } catch (error) {
        res.status(400).json(error)
    }
}

/**
 * Perform logout
  - Auth type: Simple
  - Request Body Content: None
  - Response `data` Content: A message confirming successful logout
  - Optional behavior:
    - error 400 is returned if the user does not exist
 */
export const logout = async (req, res) => {

    const refreshToken = req.cookies.refreshToken
    if (!refreshToken) return res.status(400).json({error:"Refresh token not found"})
    const user = await User.findOne({ refreshToken: refreshToken })
    if (!user) return res.status(400).json({error:'User not found'})
    try {
        user.refreshToken = null
        res.cookie("accessToken", "", { httpOnly: true, path: '/api', maxAge: 0, sameSite: 'none', secure: true })
        res.cookie('refreshToken', "", { httpOnly: true, path: '/api', maxAge: 0, sameSite: 'none', secure: true })
        const savedUser = await user.save()
        res.status(200).json({data:{message: 'User logged out'}})
    } catch (error) {
        res.status(400).json(error)
    }
}
