import { handleDateFilterParams, verifyAuth, handleAmountFilterParams } from '../controllers/utils';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config(); //secret key

const adminAccessTokenValid = jwt.sign({
    email: "admin@email.com",
    //id: existingUser.id, The id field is not required in any check, so it can be omitted
    username: "admin",
    role: "Admin"
}, process.env.ACCESS_KEY, { expiresIn: '1y' })

const adminAccessTokenExpired = jwt.sign({
    email: "admin@email.com",
    //id: existingUser.id, The id field is not required in any check, so it can be omitted
    username: "admin",
    role: "Admin"
}, process.env.ACCESS_KEY, { expiresIn: '0s' })

const testerAccessTokenValid = jwt.sign({
    email: "tester@test.com",
    username: "tester",
    role: "Regular"
}, process.env.ACCESS_KEY, { expiresIn: '1y' })

const testerAccessTokenExpired = jwt.sign({
    email: "tester@test.com",
    username: "tester",
    role: "Regular"
}, process.env.ACCESS_KEY, { expiresIn: '0s' })
const testerAccessTokenEmpty = jwt.sign({}, process.env.ACCESS_KEY, { expiresIn: "1y" })

describe("handleDateFilterParams", () => { 
   /*
    * it really doesn't need to be integration tested. 
    * It has no dependencies, everithing has already been tested in unit (and in transaction integration)
    * see slack message by Giacomo Garaccione on June 2nd 2023
    */
})

describe("verifyAuth", () => { 
    test("Tokens are both valid and belong to the requested user", () => {
        //The only difference between access and refresh token is (in practice) their duration, but the payload is the same
        //Meaning that the same object can be used for both
        const req = { cookies: { accessToken: testerAccessTokenValid, refreshToken: testerAccessTokenValid } }
        const res = {}
        //The function is called in the same way as in the various methods, passing the necessary authType and other information
        const response = verifyAuth(req, res, { authType: "User", username: "tester" })
        //The response object must contain a field that is a boolean value equal to true, it does not matter what the actual name of the field is
        //Checks on the "cause" field are omitted since it can be any string
        expect(Object.values(response).includes(true)).toBe(true)
    })

    test("Undefined tokens", () => {
        const req = { cookies: {} }
        const res = {}
        const response = verifyAuth(req, res, { authType: "Simple" })
        //The test is passed if the function returns an object with a false value, no matter its name
        expect(Object.values(response).includes(false)).toBe(true)
    })

    /**
     * The only situation where the response object is actually interacted with is the case where the access token must be refreshed
     */
    test("Access token expired and refresh token belonging to the requested user", () => {
        const req = { cookies: { accessToken: testerAccessTokenExpired, refreshToken: testerAccessTokenValid } }
        //The inner working of the cookie function is as follows: the response object's cookieArgs object values are set
        const cookieMock = (name, value, options) => {
            res.cookieArgs = { name, value, options };
        }
        //In this case the response object must have a "cookie" function that sets the needed values, as well as a "locals" object where the message must be set 
        const res = {
            cookie: cookieMock,
            locals: {},
        }
        const response = verifyAuth(req, res, { authType: "User", username: "tester" })
        //The response must have a true value (valid refresh token and expired access token)
        expect(Object.values(response).includes(true)).toBe(true)
        expect(res.cookieArgs).toEqual({
            name: 'accessToken', //The cookie arguments must have the name set to "accessToken" (value updated)
            value: expect.any(String), //The actual value is unpredictable (jwt string), so it must exist
            options: { //The same options as during creation
                httpOnly: true,
                path: '/api',
                maxAge: 60 * 60 * 1000,
                sameSite: 'none',
                secure: true,
            },
        })
        //The response object must have a field that contains the message, with the name being either "message" or "refreshedTokenMessage"
        const message = res.locals.refreshedTokenMessage ? true : res.locals.message ? true : false
        expect(message).toBe(true)
    })

    /*error: unable to refresh token*/
    test("Access token expired and refresh token belonging to the requested user", () => {
        const req = { cookies: { accessToken: testerAccessTokenExpired, refreshToken: testerAccessTokenExpired } }
        //The inner working of the cookie function is as follows: the response object's cookieArgs object values are set
        const cookieMock = (name, value, options) => {
            res.cookieArgs = { name, value, options };
        }
        //In this case the response object must have a "cookie" function that sets the needed values, as well as a "locals" object where the message must be set 
        const res = {
            cookie: cookieMock,
            locals: {},
        }
        const response = verifyAuth(req, res, { authType: "User", username: "tester" })
        //The response must have a true value (valid refresh token and expired access token)
        expect(response.authorized).toBe(false)
        expect(response.cause).toBe("Perform login again")
    })
    test("Access Token is mossing information",() => {
        const testerAccessTokenInvalid = jwt.sign({
            email: "tester@test.com",
            username: null ,
            role: "Regular"
        }, process.env.ACCESS_KEY, { expiresIn: '1y' })
        const testerAccessTokenValid = jwt.sign({
            email: "tester@test.com",
            username: "tester" ,
            role: "Regular"
        }, process.env.ACCESS_KEY, { expiresIn: '1y' })
        const mockReq = {cookies: {accessToken : testerAccessTokenInvalid ,refreshToken :testerAccessTokenValid}}
        let mockRes 
        const result = verifyAuth(mockReq,mockRes,{authType: 'S'})
        expect(result.authorized).toBe(false)
        expect(result.cause).toBe("Token is missing information")

    })
    test("Refresh Token is missing information",() => {
        const testerAccessTokenInvalid = jwt.sign({
            email: "tester@test.com",
            username: null ,
            role: "Regular"
        }, process.env.ACCESS_KEY, { expiresIn: '1y' })
        const testerAccessTokenValid = jwt.sign({
            email: "tester@test.com",
            username: "tester" ,
            role: "Regular"
        }, process.env.ACCESS_KEY, { expiresIn: '1y' })
        const mockReq = {cookies: {accessToken : testerAccessTokenValid ,refreshToken :testerAccessTokenInvalid}}
        let mockRes 
        const result = verifyAuth(mockReq,mockRes,{authType: 'S'})
        expect(result.authorized).toBe(false)
        expect(result.cause).toBe("Token is missing information")

    })
    test("Mismatched info betweed accessToken and RefreshToken",() => {
        const testerAccessTokenInvalid = jwt.sign({
            email: "tester@test.com",
            username: "tester" ,
            role: "Regular"
        }, process.env.ACCESS_KEY, { expiresIn: '1y' })
        const testerAccessTokenValid = jwt.sign({
            email: "tester@test.com",
            username: "tester1" ,
            role: "Regular"
        }, process.env.ACCESS_KEY, { expiresIn: '1y' })
        const mockReq = {cookies: {accessToken : testerAccessTokenValid ,refreshToken :testerAccessTokenInvalid}}
        let mockRes 
        const result = verifyAuth(mockReq,mockRes,{authType: 'S'})
        expect(result.authorized).toBe(false)
        expect(result.cause).toBe("Mismatched users")

    })
})

describe("handleAmountFilterParams", () => { 
    /*
    * it really doesn't need to be integration tested. 
    * It has no dependencies, everithing has already been tested in unit (and in transaction integration)
    * see slack message by Giacomo Garaccione on June 2nd 2023
    */
})
