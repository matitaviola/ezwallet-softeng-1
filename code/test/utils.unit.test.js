import { handleDateFilterParams, verifyAuth, handleAmountFilterParams } from '../controllers/utils';
import jwt from 'jsonwebtoken'

jest.mock('jsonwebtoken')

describe("handleDateFilterParams", () => { 
    test('Should return an empty obj when no params are passed', () => {
        const mockReq = {
            query:{}
        }
        
        const result = handleDateFilterParams(mockReq)
        expect(Object.keys(result).length).toBe(0);
    });

    test('Should throw an error when date and form/upto are both used', () => {
        
        //using upTo
        const mockReq = {
            query:{
                date:"2023-12-09",
                upTo:"2023-12-09"
            }
        }
        expect(()=>{handleDateFilterParams(mockReq)}).toThrow();
        try{
            handleDateFilterParams(mockReq)
        }catch(err){
            expect(err.message).toBe("Single date and interval selected")
        }

        //using from
        mockReq.query={
            date:"2023-12-09",
            from:"2023-12-09"
        }
        expect(()=>{handleDateFilterParams(mockReq)}).toThrow();
        try{
            handleDateFilterParams(mockReq)
        }catch(err){
            expect(err.message).toBe("Single date and interval selected")
        }
    });

    test('Should throw an error when using a wrong date format', () => {
        //using from
        const mockReq = {
            query:{
                from:"200023-31-45"
            }
        }
        expect(()=>{handleDateFilterParams(mockReq)}).toThrow();
        try{
            handleDateFilterParams(mockReq)
        }catch(err){
            expect(err.message).toBe("Invalid date format, please use 'YYYY-MM-DD'")
        }

        //using date
        mockReq.query={
            date:"2045-1134-09"
        }
        expect(()=>{handleDateFilterParams(mockReq)}).toThrow();
        try{
            handleDateFilterParams(mockReq)
        }catch(err){
            expect(err.message).toBe("Invalid date format, please use 'YYYY-MM-DD'")
        }
         //using upTo
         mockReq.query={
            upTo:"2045-1134-09"
        }
        expect(()=>{handleDateFilterParams(mockReq)}).toThrow();
        try{
            handleDateFilterParams(mockReq)
        }catch(err){
            expect(err.message).toBe("Invalid date format, please use 'YYYY-MM-DD'")
        }
    });

    test('Should return an close interval using both from and upto', () => {
        const fromDate = "2023-10-11";
        const toDate = "2024-11-12";
        
        const mockReq = {
            query:{
                from: fromDate,
                upTo: toDate
            }
        }
        expect(handleDateFilterParams(mockReq)).toStrictEqual({ date:{$gte: new Date(fromDate), $lte: new Date(toDate+"T23:59:59.999Z")} });
    });
    test('Should return a right-open interval using only from', () => {
        const fromDate = "2023-10-11";
        
        const mockReq = {
            query:{
                from: fromDate
            }
        }
        expect(handleDateFilterParams(mockReq)).toStrictEqual({ date:{$gte: new Date(fromDate)} });
    });

    test('Should return a left-open interval using only upto', () => {
        const toDate = "2024-11-12";
        
        const mockReq = {
            query:{
                upTo: toDate
            }
        }
        expect(handleDateFilterParams(mockReq)).toStrictEqual({ date:{$lte: new Date(toDate+"T23:59:59.999Z")} });
    });

    test('Should return a close interval using only date', () => {
        const date = "2024-11-12";
        
        const mockReq = {
            query:{
                date:date
            }
        }
        let exactDateStart = new Date(date);
        let exactDateFinal = new Date(date+"T23:59:59.999Z");
        expect(handleDateFilterParams(mockReq)).toStrictEqual({ date:{$gte:exactDateStart, $lte:exactDateFinal} });
    });
})

describe('verifyAuth', () => {
    let mockReq = {};
    let mockRes;
  
    beforeEach(() => {
      jest.resetAllMocks();
      mockReq = { cookies: { accessToken: "validAccessToken", refreshToken: "validRefreshToken" } };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        cookie: jest.fn(),
        locals: {},
      };
    });
  
    test('Success case: authorized', () => {
      const decodedValidAccessToken = {
        username: "test",
        email: "test@email.com",
        role: "Regular",
      };
      const info = { authType: 'S' };
      jest.spyOn(jwt, 'verify').mockReturnValue(decodedValidAccessToken);
  
      const result = verifyAuth(mockReq, mockRes, info);
  
      expect(result.authorized).toBe(true);
      expect(result.cause).toBe('Authorized');
    });
    
    test('User authentication : unauthorized ', () => {
        mockReq = {
            cookies: { 
                accessToken: null, 
            refreshToken: null 
        }
        }
        const info = {authType : 's'}
  
        const result = verifyAuth(mockReq,mockRes,info);
        expect(result.authorized).toBe(false);
        expect(result.cause).toBe("Unauthorized");
      });

    test('User authentication - access token missing parameters', () => {
      const decodedInvalidAccessToken = {
        username : null,
        email: "test@email.com",
        role: "regular",
      }
      const info = {authType : 'User'}
      jest.spyOn(jwt,'verify').mockReturnValue(decodedInvalidAccessToken);

      const result = verifyAuth(mockReq,mockRes,info);
      expect(result.authorized).toBe(false);
      expect(result.cause).toBe("Token is missing information");
    });

    
    
    test('User authentication - refresh token missing parameters', () => {
        const decodedValidAccessToken = {
            username: "test",
            email: "test@email.com",
            role: "Regular",
          };
        const decodedInvalidRefreshToken = {
          username: 'test',
          email:  null,
          role: "regular",
        };

        const info = {authType : 's'}
        
        jest.spyOn(jwt, 'verify')
        .mockReturnValueOnce(decodedValidAccessToken)
        .mockReturnValue(decodedInvalidRefreshToken);

        
        
        const result = verifyAuth(mockReq, mockRes, info);
        expect(result.authorized).toBe(false);
        expect(result.cause).toBe("Token is missing information");
      });
    
      test('Parameters of refresh token and access token do not match :', () => {
        const decodedValidAccessToken = {
          username : 'test1',
          email: "test@email.com",
          role: "regular",
        }
        const decodedValidRefreshToken = {
          username : 'test123',
          email: "test@email.com",
          role: "regular",
        }
        const info = {authType : 's'}
        jest.spyOn(jwt, 'verify')
        .mockReturnValueOnce(decodedValidAccessToken)
        .mockReturnValue(decodedValidRefreshToken);
        const result = verifyAuth(mockReq,mockRes,info);
        expect(result.authorized).toBe(false);
        expect(result.cause).toBe("Mismatched users");
      });

      test('Admin authentication failed role not admin',()=>{
        const decodedValidAccessToken = {
            username : 'test1',
            email: "test@email.com",
            role: "regular",
          }
        
          const info = {authType : 'Admin'}
          jest.spyOn(jwt, 'verify').mockReturnValue(decodedValidAccessToken)
          const result = verifyAuth(mockReq,mockRes,info);
          expect(result.authorized).toBe(false);
          expect(result.cause).toBe("Not admin role");
      })
      test('Admin success case ',() => {
        const decodedValidAccessToken = {
            username : 'test1',
            email: "test@email.com",
            role: "Admin",
          }
        
          const info = {authType : 'Admin'}
          jest.spyOn(jwt, 'verify').mockReturnValue(decodedValidAccessToken)
          const result = verifyAuth(mockReq,mockRes,info);
          expect(result.authorized).toBe(true);
          expect(result.cause).toBe("Authorized");

      })
      test('Get user failed :user can only retrieve info about himself :  ',()=>{
        const decodedValidAccessToken = {
            username : 'test1',
            email: "test@email.com",
            role: "regular",
          }
        
          const info = {authType : 'User', username: "test2"}
          jest.spyOn(jwt, 'verify').mockReturnValue(decodedValidAccessToken)
          const result = verifyAuth(mockReq,mockRes,info);
          expect(result.authorized).toBe(false);
          expect(result.cause).toBe("The user can only access information about his account!");
      })
      test('User auth success: ',()=>{
        const decodedValidAccessToken = {
            username : 'test1',
            email: "test@email.com",
            role: "regular",
          }
        
          const info = {authType : 'User', username: "test1"}
          jest.spyOn(jwt, 'verify').mockReturnValue(decodedValidAccessToken)
          const result = verifyAuth(mockReq,mockRes,info);
          expect(result.authorized).toBe(true);
          expect(result.cause).toBe("Authorized");
      })
      test('Group auth failed email not included:', () => {
        const decodedValidAccessToken = {
            username : 'test1',
            email: "test@email.com",
            role: "regular",
          }
        
          const info = {authType : 'Group', members :["test3456@email.com"]}
          jest.spyOn(jwt, 'verify').mockReturnValue(decodedValidAccessToken)
          const result = verifyAuth(mockReq,mockRes,info);
          expect(result.authorized).toBe(false);
          expect(result.cause).toEqual("Email is not included in the group emails");
      })
    
    
      test('Group auth success :', () => {
        const decodedValidAccessToken = {
            username : 'test1',
            email: "test@email.com",
            role: "regular",
          }
        
          const info = {authType : 'Group', members : ["test@email.com"]}
          jest.spyOn(jwt, 'verify').mockReturnValue(decodedValidAccessToken)
          const result = verifyAuth(mockReq,mockRes,info);
          expect(result.authorized).toBe(true);
          expect(result.cause).toBe("Authorized");
      })
    
      test("Accesstoken and refreshtoken expired", ()=>{
        const info = { authType: 'S' };
        
        const a=jest.spyOn(jwt,"verify")
        a.mockImplementation(()=>{ throw Object.assign(new Error("TokenExpiredError"), {name: "TokenExpiredError"})}
        )
        const result = verifyAuth(mockReq, mockRes, info);
        expect(result.authorized).toBe(false);
        expect(result.cause).toBe("Perform login again");
    })

    test('AccessToken has been refreshed',() => {
        const decodedAdminAccessToken = {
            username: "test",
            email: "test@email.com",
            role: "Admin"
        }
        const info = { authType: 'Admin' };
        
        
        jest.spyOn(jwt,'verify').mockImplementationOnce(()=>{ throw Object.assign(new Error("TokenExpiredError"), {name: "TokenExpiredError"})})

        jest.spyOn(jwt,'verify').mockReturnValueOnce(decodedAdminAccessToken);
        jest.spyOn(jwt,'sign').mockImplementationOnce(()=>decodedAdminAccessToken);
        const result = verifyAuth(mockReq, mockRes, info);
        expect(result.authorized).toBe(true);
        expect(result.cause).toBe("Authorized");
    })
      

    })
  

  
describe("handleAmountFilterParams", () => { 
    test('Should return an empty obj when no params are passed', () => {
        const mockReq = {
            query:{}
        }
        
        const result = handleAmountFilterParams(mockReq)
        expect(Object.keys(result).length).toBe(0);
    });

    test('Should throw an error when one or both parameters are not parseable to int', () => {
        
        //using both
        const mockReq = {
            query:{
                min:"min",
                max:"max"
            }
        }
        expect(()=>{handleAmountFilterParams(mockReq)}).toThrow();
        try{
            handleAmountFilterParams(mockReq)
        }catch(err){
            expect(err.message).toBe("min, max or both are not a  number")
        }
    });

    test('Should return an close interval using both min and max', () => {
        const mockReq = {
            query:{
                min:1,
                max:2
            }
        }
        
        expect(handleAmountFilterParams(mockReq)).toStrictEqual({ amount:{$gte:1, $lte:2} });
    });

    test('Should return a right-open interval using only min', () => {
        const mockReq = {
            query:{
                min:1
            }
        }
        
        expect(handleAmountFilterParams(mockReq)).toStrictEqual({ amount:{$gte:1} });
    });

    test('Should return a left-open interval using only max', () => {
        const mockReq = {
            query:{
                max:2
            }
        }
        
        expect(handleAmountFilterParams(mockReq)).toStrictEqual({ amount:{$lte:2} });
    });
})
