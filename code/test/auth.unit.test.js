
import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
const bcrypt = require("bcryptjs")

import {register,login,logout,registerAdmin} from '../controllers/auth'
import e from 'express';

jest.mock("bcryptjs")
jest.mock('../models/User.js');
jest.mock('jsonwebtoken');


	
describe('register', () => {
   
    let mockReq;
    let mockRes;
   //Before each test of register function 
   beforeEach(() => {
    jest.resetAllMocks();
    mockReq = {
        body: {
            username: "test",
            email: "test@email.com",
            password: "password"
        }
    }
    mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
       
    }
})

    //success case test 200
    test('200 - Should successfully register', async () => {
        

        jest.spyOn(User, 'findOne').mockResolvedValueOnce(null);
        jest.spyOn(User, 'create').mockResolvedValueOnce({
            username: "test",
            email: "test@email.com",
            password: "password",
            role:"Regular"
        });
        jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce("EncryptedPassword");
        await register(mockReq, mockRes);

        
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            data:
                {
                    message: 'User registred successfully.'
                }
        });
    });

    //error 400 no username null
    test("400 - Username not defined",async () => {
        mockReq.body.username = null;
        jest.spyOn(User, 'findOne').mockResolvedValueOnce(null);
        await register(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error: "All attributes are required"});

    })
    //no email null
    test("400 - Email not defined",async () => {
        mockReq.body.email = null;
        jest.spyOn(User, 'findOne').mockResolvedValueOnce(null);
        await register(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error: "All attributes are required"});

    })
    //no password null 
    test("400 - Password not defined",async () => {
        mockReq.body.password = null;
        jest.spyOn(User, 'findOne').mockResolvedValueOnce(null);
        await register(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error: "All attributes are required"});

    })

    //username empty string
    test("400 - Username empty string",async () => {
        mockReq.body.username = "  ";
        jest.spyOn(User, 'findOne').mockResolvedValueOnce(null);
        await register(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:"Parameters cannot be empty"});

    })

    //email empty string
    test("400 - Email empty string",async () => {
        mockReq.body.email = "  ";
        jest.spyOn(User, 'findOne').mockResolvedValueOnce(null);
        await register(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:"Parameters cannot be empty"});

    })
    //password empty string 
    test("400 - Password empty string",async () => {
        mockReq.body.password = "  ";
        jest.spyOn(User, 'findOne').mockResolvedValueOnce(null);
        await register(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:"Parameters cannot be empty"});

    })

    //check if the email is in a valid format 
    test("400 - Email invalid format",async() => {
        mockReq.body.email = "test"
        jest.spyOn(User, 'findOne').mockResolvedValueOnce(null);
        await register(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:"Invalid email format"});

    })

    test("400 - Username taken", async()=>
    {
    
        jest.spyOn(User, 'findOne').mockResolvedValue({
            username: "test",
            email: "notest@email.com",
        });
        await register(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:"Email/Username already registered"})

    })
    test("400 - Email already used by another person", async()=>
    {
        jest.spyOn(User, 'findOne').mockResolvedValueOnce({
            username: "notest",
            email: "test@email.com",
        });
        await register(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error: "Email/Username already registered"})

    })
});


describe("registerAdmin", () => { 
    let mockReq;
    let mockRes;
   //Before each test of register function 
   beforeEach(() => {
    jest.resetAllMocks();
    mockReq = {
        body: {
            username: "test",
            email: "test@email.com",
            password: "password"
        }
    }
    mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
       
    }
    })

    //success case test 200
    test('200 - Should successfully register the admin', async () => {
        

        jest.spyOn(User, 'findOne').mockResolvedValueOnce(null);
        jest.spyOn(User, 'create').mockResolvedValueOnce({
            username: "testAdmin",
            email: "testAdmin@email.com",
            password: "password",
            role:"Admin"
        });
        jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce("EncryptedPassword");
        await registerAdmin(mockReq, mockRes);

        
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            data:
                {
                    message: 'Admin added succesfully'
                }
        });
    });

    //error 400 no username null
    test("400 - Username not defined",async () => {
        mockReq.body.username = null;
        jest.spyOn(User, 'findOne').mockResolvedValueOnce(null);
        await registerAdmin(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error: "All attributes are required"});

    })
    //no email null
    test("400 - Email not defined",async () => {
        mockReq.body.email = null;
        jest.spyOn(User, 'findOne').mockResolvedValueOnce(null);
        await registerAdmin(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error: "All attributes are required"});

    })
    //no password null 
    test("400 - Password not defined",async () => {
        mockReq.body.password = null;
        jest.spyOn(User, 'findOne').mockResolvedValueOnce(null);
        await registerAdmin(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error: "All attributes are required"});

    })

    //username empty string
    test("400 - Username empty string",async () => {
        mockReq.body.username = "  ";
        jest.spyOn(User, 'findOne').mockResolvedValueOnce(null);
        await registerAdmin(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:"Parameters cannot be empty"});

    })

    //email empty string
    test("400 -Email empty string",async () => {
        mockReq.body.email = "  ";
        jest.spyOn(User, 'findOne').mockResolvedValueOnce(null);
        await registerAdmin(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:"Parameters cannot be empty"});

    })
    //password empty string 
    test("400 - Password empty string",async () => {
        mockReq.body.password = "  ";
        jest.spyOn(User, 'findOne').mockResolvedValueOnce(null);
        await registerAdmin(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:"Parameters cannot be empty"});

    })

    //check if the email is in a valid format 
    test("400 -Email invalid format",async() => {
        mockReq.body.email = "test"
        jest.spyOn(User, 'findOne').mockResolvedValueOnce(null);
        await registerAdmin(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:"Invalid email format"});

    })

    test("400 - Username taken", async()=>
    {
    
        jest.spyOn(User, 'findOne').mockResolvedValue({
            username: "testAdmin",
            email: "notest@email.com",
        });
        await registerAdmin(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:"Email/Username already registered"})

    })
    test("400 - Email already used by another person", async()=>
    {
        jest.spyOn(User, 'findOne').mockResolvedValueOnce({
            username: "notestAdmin",
            email: "test@email.com",
        });
        await registerAdmin(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error: "Email/Username already registered"})

    })
})

describe('login', () => {
    let req, res;
  
    beforeEach(() => {
      jest.resetAllMocks();
      req = {
        body: {
            email: "test@email.com",
            password: "password"
        },
        cookies: {},
      };
      res = {
        status: jest.fn(() => res),
        json: jest.fn(),
        cookie: jest.fn(),
      };
    });
  
    
  
    test('400 - Returns error if email or password is missing', async () => {
        req.body.email = null;
        await login(req, res);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "All attributes are required" });
    });
  
    test('400 - Returns error if email or password is empty string', async () => {
      req.body.email = '  ';
      req.body.password = '  ';
  
      await login(req, res);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Parameters cannot be empty" });
    });
  
    test('400 - Returns error if email is in an invalid format', async () => {
      req.body.email = 'invalidEmail';
  
      await login(req, res);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid email format" });
    });
  
    test('400 - Returns error if user does not exist', async () => {
      const User = {
        findOne: jest.fn(() => Promise.resolve(null)),
      };
  
      req.body.email = 'existingUser@example.com';
      req.body.password = 'password';
  
      await login(req, res);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'please you need to register' });
    });
  
    test('400 - Returns error if password is incorrect', async () => {
        jest.spyOn(User, 'findOne').mockResolvedValueOnce({
            email: "test@email.com",
            assword: "password" })
        await login(req, res);
      
        jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false);
        await login(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'wrong credentials' });
      
    });

    test("200 - Should login successfully with valid credentials", async () => {
        const email = 'test@test.com';
        const password = 'password';
        const hashedPassword = await bcrypt.hash(password, 10);
        const existingUser = {
            email: email,
            password: hashedPassword,
            id: 'user_id',
            username: 'username',
            role: 'Regular',
            save: jest.fn().mockResolvedValue(true)
        };
        
        const mockReq = {
            body: {
                email: email,
                password: password
            },
            cookies: {}
        };
        const mockRes = {
            cookie: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    
        // Mock the User.findOne method to return the existingUser
        jest.spyOn(User, 'findOne').mockResolvedValue(existingUser);
    
        // Mock bcrypt.compare to return true (valid password)
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
    
        // Define expected tokens
        const expectedAccessToken = jwt.sign({
            email: existingUser.email,
            id: existingUser.id,
            username: existingUser.username,
            role: existingUser.role
        }, process.env.ACCESS_KEY, { expiresIn: '1h' });
    
        const expectedRefreshToken = jwt.sign({
            email: existingUser.email,
            id: existingUser.id,
            username: existingUser.username,
            role: existingUser.role
        }, process.env.ACCESS_KEY, { expiresIn: '7d' });
    
        // Call the login function with the mock request and response
        await login(mockReq, mockRes);
    
        // Check if the response was sent with the correct status
        expect(mockRes.status).toHaveBeenCalledWith(200);
    
        // Check if the response was sent with the correct data
        expect(mockRes.json).toHaveBeenCalledWith({ data: { accessToken: expectedAccessToken, refreshToken: expectedRefreshToken }});
    
        // Check if the cookies were set correctly
        expect(mockRes.cookie).toHaveBeenCalledWith('accessToken', expectedAccessToken, expect.any(Object));
        expect(mockRes.cookie).toHaveBeenCalledWith('refreshToken', expectedRefreshToken, expect.any(Object));
    });
  
    
  });
  

describe('logout', () => {
    let mockReq;
    let mockRes;
    beforeEach(() => {
        jest.resetAllMocks();

        mockReq = {
            cookies: {
                refreshToken: 'validToken'
            }
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            cookie: jest.fn()
        };
    });
    
    test('400 - No refresh token',async ()=>{
        mockReq.cookies.refreshToken = null;
        await logout(mockReq, mockRes);


        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "Refresh token not found" });
    });

    test('400 - User not found', async () =>{
        jest.spyOn(User, 'findOne').mockResolvedValueOnce(null); // No user found

        await logout(mockReq,mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'User not found' });

    })
    
    test('200 - User logged out successfully',async()=>{
        const user = {
            refreshToken: 'validToken',
            save: jest.fn().mockResolvedValue({})
        };

        User.findOne = jest.fn().mockResolvedValue(user);

        await logout(mockReq, mockRes);


        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({ data: { message: 'User logged out' } });
    });
    });
        
   
