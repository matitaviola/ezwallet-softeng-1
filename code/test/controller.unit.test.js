import request from 'supertest';
import { app } from '../app';
import { categories, transactions } from '../models/model';
import { User, Group } from '../models/User';
import { createTransaction, getAllTransactions, getTransactionsByUser, getTransactionsByUserByCategory,
         getTransactionsByGroup, getTransactionsByGroupByCategory, deleteTransaction, deleteTransactions,
         createCategory, getCategories, updateCategory, deleteCategory} from '../controllers/controller';
import { verifyAuth, handleDateFilterParams, handleAmountFilterParams } from '../controllers/utils';
import { types } from '@babel/core';

jest.mock('../models/model');
jest.mock('../models/User');
//used to avoid using cookies in the test that checks stuff not related to auth
jest.mock("../controllers/utils.js", ()=> ({verifyAuth: jest.fn(),
     handleDateFilterParams: jest.fn(), handleAmountFilterParams: jest.fn()}));

beforeEach(() => {
  categories.find.mockClear();
  categories.findOne.mockClear();
  categories.findOne.mockClear();
  transactions.find.mockClear();
  transactions.deleteOne.mockClear();
  transactions.aggregate.mockClear();
  transactions.prototype.save.mockClear();
  Group.find.mockClear();
});


describe("createCategory", () => { 

    //**************** test: unauthorized access
    test ('401 - Unathorized access', async()=> {
        //mock auth failed
        const expectedCause = "Not admin role";
        verifyAuth.mockReturnValue({authorized:false, cause:expectedCause});
        const mockReq = { body: { type: "type1", color: "color1" } };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await createCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
    });

     //***************** test: checking empty parameters
     test ('400 - Empty - invalid value parameters', async()=> {
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        const mockReq = {
            body:{type:"type1", color:"color1"},
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        };
        const expectedError = "Request's body is incomplete; it should contain non-empty type and color";

        //missing color
        mockReq.body =  {type:"test"}
        await createCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedError});

        //type doesn't have a value
        mockReq.body =  {type:""}
        await createCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedError});

        //missing type
        mockReq.body =  {color:"testcolor"}
        await createCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedError});

        //color doesn't have a value
        mockReq.body =  {color:""}
        await createCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedError});

        //missing both type and color
        mockReq.body =  {}
        await createCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedError});
    });

    //***************** test: checking category already existed
    test ('400 - A category of this type is already present', async()=> {
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        const mockReq = {
            body:{type:"type1", color:"color1"},
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        };
        const expectedError = "A category of this type is already present";

        jest.spyOn(categories, "findOne").mockResolvedValue({ type: "type1", color: "color1" });
        await createCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedError});
    });

    //***************** test: correct execution
    test('200 - Category created successfully', async () => {
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        const mockReq = { body: { type: "type1", color: "color1" } };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const newCategory = { type: 'type1', color: 'color1' };
        categories.findOne.mockResolvedValue(null);
        categories.create.mockResolvedValue(newCategory);

        await createCategory(mockReq, mockRes);

        expect(categories.findOne).toHaveBeenCalledWith({ type: 'type1' });
        expect(categories.create).toHaveBeenCalledWith({
            type: 'type1',
            color: 'color1',
        });
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            data: newCategory,
            refreshedTokenMessage: mockRes.locals.refreshedTokenMessage,
        });
    });
})


describe("updateCategory", () => { 

    //**************** test: unauthorized access
    test ('401 - Unathorized access', async()=> {
        //mock auth failed
        const expectedCause = "Not admin role";
        verifyAuth.mockReturnValue({authorized:false, cause:expectedCause});
        const mockReq = {
            params: {
                type: 'food',
            },
            body: {
                type: 'Food',
                color: 'yellow',
            },
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined,
            }
        };

        await updateCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
    });

    //***************** test: checking empty values in body
    test ('400 - Empty values', async()=> {
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        const mockReq = {
            params: {
              type: 'type1',
            },
            body: {
              type: 'type2',
              color: 'color1',
            },
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        };
        const expectedError = "Request's body is incomplete; it should contain non-empty type and color";

        //empty color
        mockReq.body =  {type:"type2", color:""}
        await updateCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedError});

        //empty type
        mockReq.body =  {type:"", color:"color1"}
        await updateCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedError});

        //missing both type and color
        mockReq.body =  {type:"", color:""}
        await updateCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedError});
    });

    //***************** test: checking missing values for attributes
    test ('400 - Missing values', async()=> {
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        const mockReq = {
            params: {
              type: 'type1',
            },
            body: {
              type: 'type2',
              color: 'color1',
            },
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        };
        const expectedError = "Missing values in the parameters or body";

        //invalid color
        mockReq.body =  {type:"type2"}
        await updateCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedError});

        //missing type
        mockReq.body =  {color:"color1"}
        await updateCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedError});
    });

    //***************** test: checking updated category's type exists already 
    test ('400 - New type belongs to another category', async()=> {
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        const mockReq = {
            params: {
            type: 'oldType',
            },
            body: {
            type: 'newType',
            color:1
            },
        };
        const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
                refreshedTokenMessage: undefined
            }
        };
        const expectedError = "The new category type is already present and belongs to another category";
        
        const existingCategory = { type: 'newType' };
        jest.spyOn(categories,"findOne").mockResolvedValueOnce({type:'oldType'}).mockResolvedValueOnce(existingCategory);

        await updateCategory(mockReq, mockRes);

        expect(categories.findOne).toHaveBeenCalledWith({ type: 'oldType' });
        expect(categories.findOne).toHaveBeenCalledWith({ type: 'newType' });
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
             error: expectedError,
             refreshedTokenMessage: mockRes.locals.refreshedTokenMessage,
        });
    });

    //***************** test: Category doesn't exist
    test ('400 - Category does not exist', async()=> {
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        const mockReq = {
            params: {
                type: 'nonexisting',
            },
            body: {
                type: 'nonexisting',
                color: 'color1',
            },
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined,
            },
        };
        const expectedError = "The requested category doesn't exists";
        const mockCategory = null;
    
        jest.spyOn(categories,"findOne").mockResolvedValue(mockCategory);
    
        await updateCategory(mockReq, mockRes);
    
        expect(categories.findOne).toHaveBeenCalledWith({ type: 'nonexisting' });
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
            error: expectedError
        });
    });
    
    
    //***************** test: correct execution
    test('200 - Category updated successfully (changed also the type)', async () => {
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        const mockReq = {
           params: {
               type: 'food',
             },
             body: {
                 type: 'health',
                 color: 'yellow',
             },
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined,
            },
        };

        const mockCategory = {
            type: 'food',
            color: 'yellow'
        };
        const mockCount = {
            modifiedCount: 2,
        };

        jest.spyOn(categories,"findOne").mockResolvedValueOnce(mockCategory) //finds a category
        .mockResolvedValueOnce(null); //finds a categroy with the new value
        jest.spyOn(transactions,"updateMany").mockResolvedValueOnce(mockCount);
        jest.spyOn(categories,"updateOne").mockResolvedValue(mockCategory);

        await updateCategory(mockReq, mockRes);

        expect(categories.findOne).toHaveBeenCalledWith({ type: 'food' });
        expect(categories.findOne).toHaveBeenCalledWith({ type: 'health' });
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            data: { message: 'Category updated successfully', count: 2 },
            refreshedTokenMessage: undefined,
        });
    });

     //***************** test: correct execution
     test('200 - Category updated successfully (changed only the color)', async () => {
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        const mockReq = {
           params: {
               type: 'food',
             },
             body: {
                 type: 'food',
                 color: 'red',
             },
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined,
            },
        };

        const mockCategory ={
            type: 'food',
            color: 'yellow'
        };

        jest.spyOn(categories,"findOne").mockResolvedValueOnce(mockCategory);
        jest.spyOn(categories,"updateOne").mockResolvedValue({ type: "food",  color:"yellow" });

        await updateCategory(mockReq, mockRes);

        expect(categories.findOne).toHaveBeenCalledWith({ type: 'food' });
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            data: { message: 'Category updated successfully', count: 0 },
            refreshedTokenMessage: undefined,
        });
    });
})

describe("deleteCategory", () => { 

    //**************** test: unauthorized access
    test ('401 - Unathorized access', async()=> {
        //mock auth failed
        const expectedCause = "Not admin role";
        verifyAuth.mockReturnValue({authorized:false, cause:expectedCause});
        const mockReq = {
            body: {
                types: ['category1', 'category2'],
            }
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined,
            }
        };

        await deleteCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
    });


    //***************** test: checking missing types to be deleted
    test ('400 - Missing array of types', async()=> {
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        const mockReq = {
            body: {
            },
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        };
        const expectedError = "Request's body is incomplete. It should contain a non-empty array of types";

        await deleteCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedError});
    });

    //***************** test: checking Empty array types to be deleted
    test ('400 - Empty array of types', async()=> {
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        const mockReq = {
            body: {
                types: []
            },
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        };
        const expectedError = "Request's body is incomplete. It should contain a non-empty array of types";

        await deleteCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedError});
    });

    //***************** test: checking Empty types to be deleted
    test ('400 - Category with empty type to be deleted', async()=> {
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        const mockReq = {
            body: {
                types: ['category1', ''],
            },
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        };
        const expectedError = "Types in the array should not be empty";

        await deleteCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedError});
    });

    //***************** test: Category of this type is not existed
    test ('400 - Category of this type does not exist', async()=> {
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        const mockReq = {
            body: {
                types: ['category1', 'category2'],
            },
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined,
            },
        };
        
        const expectedCause = "The category of type 'category1' doesn't exist";

        categories.countDocuments = jest.fn().mockResolvedValueOnce(4); // 4 categories in the database
        categories.findOne = jest.fn().mockResolvedValueOnce(undefined); // first category does not exist
    
        await deleteCategory(mockReq, mockRes);
    

        expect(categories.countDocuments).toHaveBeenCalled();
        expect(categories.findOne).toHaveBeenCalledWith({ type: 'category1' });
        
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: expectedCause});
    });
    

    //***************** test: Delete only one available category
    test('400 - Trying to delete the only available category', async () => {
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        const mockReq = {
            body: {
                types: ['category1'],
            },
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined,
            },
        };
        const expectedCause = "There is only one category in the database and it cannot be deleted";

        categories.countDocuments.mockResolvedValueOnce(1); // 1 category in the database

        await deleteCategory(mockReq, mockRes);

        expect(categories.countDocuments).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: expectedCause});
    });


    //***************** test: checking Category deleted successfully when passing less categories than the existing ones
    test('200 - Category deleted successfully (N>T)', async () => {
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        const mockReq = {
            body: {
                types: ['category1'],
            },
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc",
            },
        };

        categories.countDocuments.mockResolvedValueOnce(2); // 2 categories in the database
        categories.findOne = jest.fn().mockResolvedValueOnce({type:"category1", color:"green"}) 
            .mockResolvedValueOnce({type:"oldestOutside", color:"green"});//oldest category
        categories.findOneAndDelete = jest.fn().mockResolvedValue(true);
        transactions.updateMany = jest.fn().mockResolvedValue({modifiedCount:1}); //there was 1 transaction of type "category1"

        await deleteCategory(mockReq, mockRes);

        expect(categories.countDocuments).toHaveBeenCalled();
        expect(categories.findOneAndDelete).toHaveBeenCalledWith({type:"category1"});
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({ data: { message: "Categories deleted", count: 1 }, refreshedTokenMessage:"abc" });
    });

    //***************** test: checking Category deleted successfully when passing the same number of categories as the existing ones
    test('200 - Category deleted successfully (N = T)', async () => {
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        const mockReq = {
            body: {
                types: ['category1','oldestIn'],
            },
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc",
            },
        };

        categories.countDocuments.mockResolvedValueOnce(2); // 2 categories in the database
        categories.findOne = jest.fn().mockResolvedValueOnce({type:"category1", color:"green"}) 
            .mockResolvedValueOnce({type:"oldestIn", color:"green"})
            .mockResolvedValueOnce({type:"oldestIn", color:"green"});//oldest category
        categories.findOneAndDelete = jest.fn().mockResolvedValue(true);
        transactions.updateMany = jest.fn().mockResolvedValue({modifiedCount:2})//there were 2 transaction of type "category1" and 1 for oldest

        await deleteCategory(mockReq, mockRes);

        expect(categories.countDocuments).toHaveBeenCalled();
        expect(categories.findOneAndDelete).toHaveBeenCalledWith({type:"category1"});
        expect(categories.findOneAndDelete).not.toHaveBeenCalledWith({type:"oldestIn"}); //we can't delete the oldest
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({ data: { message: "Categories deleted", count: 2 }, refreshedTokenMessage:"abc" });
    });
})

describe("getCategories", () => { 

    //**************** test: unauthorized access
    test ('401 - Unathorized access', async()=> {
        //mock auth failed
        const expectedCause = "Simple";
        verifyAuth.mockReturnValue({authorized:false, cause:expectedCause});
        const mockReq = {};
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined,
            }
        };

        await getCategories(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
    });

    test('200 - Returns list of all categories', async () => {
        verifyAuth.mockReturnValue({authorized:true});
        const mockReq = {};
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const retrievedCategories = [{ type: "type1", color: "color1" },
        { type: "type2", color: "color2" }];
        jest.spyOn(categories, "find").mockResolvedValue(retrievedCategories);


        await getCategories(mockReq, mockRes);

        expect(categories.find).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            data: retrievedCategories,
            refreshedTokenMessage: mockRes.locals.refreshedTokenMessage
        });
    });

    test('200 - Returns empty list (no categories)', async () => {
        verifyAuth.mockReturnValue({authorized:true});
        const mockReq = {};
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const retrievedCategories = [];
        jest.spyOn(categories, "find").mockResolvedValue(retrievedCategories);


        await getCategories(mockReq, mockRes);

        expect(categories.find).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            data: retrievedCategories,
            refreshedTokenMessage: mockRes.locals.refreshedTokenMessage
        });
    });
})

describe("createTransaction", () => {
    
    test ('401 - Unathorized access', async()=> {
        //mock auth failed
        const expectedCause = "Mismatched users";
        verifyAuth.mockReturnValue({authorized:false, cause:expectedCause});
        const mockReq = {
            params:{username:"nottestuser"},

            cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await createTransaction(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
    });

    test('400 - Missing or empty body parameter', async() => {
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        const mockReq = {
            params:{username:"testuser"},
            body:{amount:"1", type:"test"},
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        const expectedError = "One or more parameters are missing or empty";

        //missing username
        await createTransaction(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedError});

        //missing amount
        mockReq.body =  {username:"testuser", type:"test"}
        await createTransaction(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedError});

        //missing type
        mockReq.body =  {username:"testuser", amount:"1"}
        await createTransaction(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedError});

        //missing username and amount
        mockReq.body =  {type:"test"}
        await createTransaction(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedError});

        //missing username and test
        mockReq.body =  {amount:"1"}
        await createTransaction(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedError});

        //missing amount and test
        mockReq.body =  {username:"testuser"}
        await createTransaction(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedError});

        //missing all
        mockReq.body =  {}
        await createTransaction(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedError});
    });
    
    test('400 - Amount cannot be parsed', async() => {
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        const mockReq = {
            params:{username:"testuser"},
            body:{username:"testuser", amount:"Mojito", type:"test"},
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        const expectedError = "Not parseable amount";

        await createTransaction(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedError});

    });

    test('400 - User param and body mismatch', async() => {
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        const mockReq = {
            params:{username:"nottestuser"},
            body:{username:"testuser", amount:"1", type:"test"},
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        const expectedError = "User param and body mismatch";

        await createTransaction(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedError});

    });

    test('400 - User not found', async () => {
        //mock auth
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        //mock mongoose schemas
        jest.spyOn(User, "findOne").mockImplementation((par) => {return null});
        //mock req and res
        const mockReq = {
            params:{username:"testuser"},
            body:{username:"testuser", amount:"1", type:"test"}
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {refreshedTokenMessage:"abc"}
        };
        const expectedErrorMessage ="No such User";

        await createTransaction(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error:expectedErrorMessage});

    });

    test('400 - Category not found', async () => {
        //mock auth
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        //mock mongoose schemas
        jest.spyOn(User, "findOne").mockImplementation((par) => {return {username:par}});
        jest.spyOn(categories, "findOne").mockImplementation((par) => {return null});
        //mock req and res
        const mockReq = {
            params:{username:"testuser"},
            body:{username:"testuser", amount:"1", type:"test"}
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {refreshedTokenMessage:"abc"}
        };
        const expectedErrorMessage ="No such Category";

        await createTransaction(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error:expectedErrorMessage});

    });

    test('200 - Transaction correctly inserted', async () => {
        //mock auth
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        //mock mongoose schemas
        jest.spyOn(User, "findOne").mockImplementation((par) => {return {username:par}});
        jest.spyOn(categories, "findOne").mockImplementation((par) => {return { type:par }});
        transactions.prototype.save = jest.fn().mockResolvedValue({ username: "testuser",  amount:"1", type:"test", date:"2023-05-30" });
        //mock req and res
        const mockReq = {
            params:{username:"testuser"},
            body:{username:"testuser", amount:"1", type:"test"}
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {refreshedTokenMessage:"abc"}
        };
        const expectedTrans = {username:"testuser", type:"test", amount:"1", date:"2023-05-30"};

        await createTransaction(mockReq,mockRes);
        expect(transactions.prototype.save).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({data:expectedTrans, refreshedTokenMessage:mockRes.locals.refreshedTokenMessage});

    });
})

describe("getAllTransactions", () => { 
    test ('401 - Unathorized access', async()=> {
        //mock auth failed
        const expectedCause = "Not admin role";
        verifyAuth.mockReturnValue({authorized:false, cause:expectedCause});
        const mockReq = {};
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {refreshedTokenMessage:"abc"}
        };

        await getAllTransactions(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
    });

    test('200 - Returns multiple transactions', async () => {
        //auth mocking
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        const retrievedTransactions = [{username:"u1", amount:"1", type:"ecommerce", date:"30-05-2023", categories_info:{color:"red"}},
            {username:"u2", amount:"1", type:"shopping", date:"30-05-2023", categories_info:{color:"yellow"}}];
        jest.spyOn(transactions, "aggregate").mockImplementation(() => {return new Promise((resolve,reject)=>{resolve(retrievedTransactions)})});
        const expectedTransactions = [{username:"u1", amount:"1", type:"ecommerce", date:"30-05-2023", color:"red"},
        {username:"u2", amount:"1", type:"shopping", date:"30-05-2023", color:"yellow"}]

        const mockReq = {};
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {refreshedTokenMessage:"abc"}
        };

        await getAllTransactions(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({data:expectedTransactions, refreshedTokenMessage:mockRes.locals.refreshedTokenMessage});
    });

    test('200 - Should find empty list if no transactions are present', async () => {
        //auth mocking
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        const retrievedTransactions = [];
        jest.spyOn(transactions, "aggregate").mockImplementation(() => {return new Promise((resolve,reject)=>{resolve(retrievedTransactions)})});

        const mockReq = {};
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {refreshedTokenMessage:"abc"}
        };

        await getAllTransactions(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({data:[], refreshedTokenMessage:mockRes.locals.refreshedTokenMessage});
    });
})

describe("getTransactionsByUser", () => { 
    test ('401 - Unathorized access - User', async()=> {
        //mock auth failed
        const expectedCause = "Mismatched users";
        verifyAuth.mockReturnValue({authorized:false, cause:expectedCause});
        const mockReq = {
            url:"/api/users/:username/transactions",
            params:{username:"nottestuser"},
            cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await getTransactionsByUser(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
    });

    test ('401 - Unathorized access - Admin', async()=> {
        //mock auth failed
        const expectedCause = "Not admin role";
        verifyAuth.mockReturnValue({authorized:false, cause:expectedCause});
        const mockReq = {
            url:"/api/transactions/users/:username",
            params:{username:"testuser"},
            cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await getTransactionsByUser(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
    });

    test('400 - User not found', async () => {
        //mock auth
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        //mock mongoose schemas
        jest.spyOn(User, "findOne").mockImplementation((par) => {return null});
        //mock req and res
        const mockReq = {
            //user route
            url:"/api/users/:username/transactions",
            params:{username:"testuser"}
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {refreshedTokenMessage:"abc"}
        };
        const expectedErrorMessage ="No such User";

        await getTransactionsByUser(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error:expectedErrorMessage});

        //admin route
        mockReq.url="/api/transactions/users/:username";
        await getTransactionsByUser(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error:expectedErrorMessage});

    });

    test('200 - Returns multiple transactions for testuser', async () => {
        //auth mocking
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        const retrievedTransactions = [{username:"testuser", amount:"1", type:"ecommerce", date:"30-05-2023", categories_info:{color:"red"}},
            {username:"testuser", amount:"1", type:"shopping", date:"30-05-2023", categories_info:{color:"yellow"}}];

        jest.spyOn(User, "findOne").mockImplementation((par) => {return {username:par}});
        jest.spyOn(transactions, "aggregate").mockImplementation(() => {return new Promise((resolve,reject)=>{resolve(retrievedTransactions)})});
        handleDateFilterParams.mockReturnValue({});
        handleAmountFilterParams.mockReturnValue({});

        const expectedTransactions = [{username:"testuser", amount:"1", type:"ecommerce", date:"30-05-2023", color:"red"},
        {username:"testuser", amount:"1", type:"shopping", date:"30-05-2023", color:"yellow"}]

        const mockReq = {
            //user route
            url:"/api/users/:username/transactions",
            params:{username:"testuser"},
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {refreshedTokenMessage:"abc"}
        };

        await getTransactionsByUser(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({data:expectedTransactions, refreshedTokenMessage:mockRes.locals.refreshedTokenMessage});

        //admin route
        mockReq.url="/api/transactions/users/:username";
        await getTransactionsByUser(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({data:expectedTransactions, refreshedTokenMessage:mockRes.locals.refreshedTokenMessage});
    });

    test('200 - Returns empty array because user has no transactions', async () => {
        //auth mocking
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        const retrievedTransactions = [];

        jest.spyOn(User, "findOne").mockImplementation((par) => {return {username:par}});
        jest.spyOn(transactions, "aggregate").mockImplementation(() => {return new Promise((resolve,reject)=>{resolve(retrievedTransactions)})});
        handleDateFilterParams.mockReturnValue({});
        handleAmountFilterParams.mockReturnValue({});
        const expectedTransactions = []

        const mockReq = {
            //user route
            url:"/api/users/:username/transactions",
            params:{username:"testuser"},
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {refreshedTokenMessage:"abc"}
        };

        await getTransactionsByUser(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({data:expectedTransactions, refreshedTokenMessage:mockRes.locals.refreshedTokenMessage});

        //admin route
        mockReq.url="/api/transactions/users/:username";
        await getTransactionsByUser(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({data:expectedTransactions, refreshedTokenMessage:mockRes.locals.refreshedTokenMessage});
    });

})

describe("getTransactionsByUserByCategory", () => { 
    test ('401 - Unathorized access - User', async()=> {
        //mock auth failed
        const expectedCause = "Mismatched users";
        verifyAuth.mockReturnValue({authorized:false, cause:expectedCause});
        const mockReq = {
            url:"/api/users/:username/transactions/category/:category",
            params:{username:"nottestuser"},
            cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await getTransactionsByUserByCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
    });

    test ('401 - Unathorized access - Admin', async()=> {
        //mock auth failed
        const expectedCause = "Not admin role";
        verifyAuth.mockReturnValue({authorized:false, cause:expectedCause});
        const mockReq = {
            url:"/api/transactions/users/:username/category/:category",
            params:{username:"testuser"},
            cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await getTransactionsByUserByCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
    });

    test('400 - User not found', async () => {
        //mock auth
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        //mock mongoose schemas
        jest.spyOn(User, "findOne").mockImplementation((par) => {return null});
        //mock req and res
        const mockReq = {
            //user route
            url:"/api/users/:username/transactions",
            params:{username:"testuser"}
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {refreshedTokenMessage:"abc"}
        };
        const expectedErrorMessage ="No such User";

        await getTransactionsByUserByCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error:expectedErrorMessage});

        //admin route
        mockReq.url="/api/transactions/users/:username";
        await getTransactionsByUserByCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error:expectedErrorMessage});

    });

    test('400 - Category not found', async () => {
        //mock auth
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        //mock mongoose schemas
        jest.spyOn(User, "findOne").mockImplementation((par) => {return {username:par}});
        jest.spyOn(categories, "findOne").mockImplementation((par) => {return null});
        //mock req and res
        const mockReq = {
            //user route
            url:"/api/users/:username/transactions/category/:category",
            params:{username:"testuser", category:"ecommerce"}
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {refreshedTokenMessage:"abc"}
        };
        const expectedErrorMessage ="No such Category";

        await getTransactionsByUserByCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error:expectedErrorMessage});

        //admin route
        mockReq.url="/api/transactions/users/:username/category/:category";
        await getTransactionsByUserByCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error:expectedErrorMessage});

    });

    test('200 - Returns multiple transactions for testuser', async () => {
        //auth mocking
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        const retrievedTransactions = [{username:"testuser", amount:"1", type:"ecommerce", date:"30-05-2023", categories_info:{color:"red"}},
            {username:"testuser", amount:"1", type:"ecommerce", date:"30-05-2023", categories_info:{color:"red"}}];

        jest.spyOn(User, "findOne").mockImplementation((par) => {return {username:par}});
        jest.spyOn(categories, "findOne").mockImplementation((par) => {return {type:par}});
        jest.spyOn(transactions, "aggregate").mockImplementation(() => {return new Promise((resolve,reject)=>{resolve(retrievedTransactions)})});

        const expectedTransactions = [{username:"testuser", amount:"1", type:"ecommerce", date:"30-05-2023", color:"red"},
        {username:"testuser", amount:"1", type:"ecommerce", date:"30-05-2023", color:"red"}]

        const mockReq = {
            //user route
            url:"/api/users/:username/transactions/category/:category",
            params:{username:"testuser", category:"ecommerce"},
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {refreshedTokenMessage:"abc"}
        };

        await getTransactionsByUserByCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({data:expectedTransactions, refreshedTokenMessage:mockRes.locals.refreshedTokenMessage});

        //admin route
        mockReq.url="/api/transactions/users/:username/category/:category";
        await getTransactionsByUserByCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({data:expectedTransactions, refreshedTokenMessage:mockRes.locals.refreshedTokenMessage});
    });

    test('200 - Rerturn empty array because user has no transactions/no transaction with such category', async () => {
        //auth mocking
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        const retrievedTransactions = [];

        jest.spyOn(User, "findOne").mockImplementation((par) => {return {username:par}});
        jest.spyOn(categories, "findOne").mockImplementation((par) => {return {type:par}});
        jest.spyOn(transactions, "aggregate").mockImplementation(() => {return new Promise((resolve,reject)=>{resolve(retrievedTransactions)})});
        const expectedTransactions = []

        const mockReq = {
            //user route
            url:"/api/users/:username/transactions",
            params:{username:"testuser", category:"ecommerce"},
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {refreshedTokenMessage:"abc"}
        };

        await getTransactionsByUserByCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({data:expectedTransactions, refreshedTokenMessage:mockRes.locals.refreshedTokenMessage});

        //admin route
        mockReq.url="/api/transactions/users/:username";
        await getTransactionsByUserByCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({data:expectedTransactions, refreshedTokenMessage:mockRes.locals.refreshedTokenMessage});
    });
})

describe("getTransactionsByGroup", () => {
     
    test( '400 - Not an existing group', async () => {
        jest.spyOn(Group, "findOne").mockImplementation((par) => {return null});
        const expectedErrorMessage = "No such Group";

        const mockReq = {
            url:"/groups/:name/transactions",
            params:{name:"testgroup"},
            cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await getTransactionsByGroup(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedErrorMessage});

    });

    test ('401 - Unathorized access - User not part of group', async()=> {
        jest.spyOn(Group, "findOne").mockImplementation((par) => {return {members:[]}});
        const expectedCause = "Email is not included in the group emails";
        verifyAuth.mockReturnValue({authorized:false, cause:expectedCause});

        const mockReq = {
            url:"/groups/:name/transactions",
            params:{name:"testgroup"},
            cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await getTransactionsByGroup(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
    });

    test ('401 - Unathorized access - Admin', async()=> {
        jest.spyOn(Group, "findOne").mockImplementation((par) => {return {members:[]}});
        const expectedCause = "Not admin role";
        verifyAuth.mockReturnValue({authorized:false, cause:expectedCause});

        const mockReq = {
            url:"/transactions/groups/:name",
            params:{name:"testgroup"},
            cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await getTransactionsByGroup(mockReq,mockRes);
        expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Admin" });
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
    });

    test('200 - Returns a transactions for each user in group', async () => {
        const user1 = {username:"testuser1", email:"u1@mail.com"};
        const user2 = {username:"testuser2", email:"u2@mail.com"};
        
        //auth mocking
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});

        const transaction1 = {username:"testuser1", amount:"1", type:"ecommerce", date:"30-05-2023", categories_info:{color:"red"}};
        const transaction2 =  {username:"testuser2", amount:"1", type:"shopping", date:"30-05-2023", categories_info:{color:"yellow"}};

        Group.findOne = jest.fn().mockResolvedValue({members:[user1, user2]});
        User.findOne = jest.fn().mockImplementationOnce(() => {return new Promise((resolve,reject)=>{
            resolve(user1)})})
            .mockImplementationOnce(() => {return new Promise((resolve,reject)=>{
                resolve(user2)})});
        
        jest.spyOn(transactions, "aggregate").mockImplementationOnce(() => {return new Promise((resolve,reject)=>{
                resolve([transaction1]);
        })});
        jest.spyOn(transactions, "aggregate").mockImplementationOnce(() => {return new Promise((resolve,reject)=>{
            resolve([transaction2]);
        })});

        const expectedTransactions = [{username:"testuser1", amount:"1", type:"ecommerce", date:"30-05-2023", color:"red"},
        {username:"testuser2", amount:"1", type:"shopping", date:"30-05-2023", color:"yellow"}]

        const mockReq = {
            //user route
            url:"/api/groups/:name/transactions",
            params:{username:"testuser"},
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {refreshedTokenMessage:"abc"}
        };
        
        await getTransactionsByGroup(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({data:expectedTransactions, refreshedTokenMessage:mockRes.locals.refreshedTokenMessage});

        //admin route
        mockReq.url="/api/transactions/groups/:name";
        await getTransactionsByGroup(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({data:expectedTransactions, refreshedTokenMessage:mockRes.locals.refreshedTokenMessage});
    });

    test('200 - Returns a transactions for each user in group, but a user has no transactions', async () => {
        const user1 = {username:"testuser1",email:"u1@mail.com"};
        const user2 = {username:"testuser2",email:"u2@mail.com"};
        const user3 = {username:"testuser3",email:"u3@mail.com"};

        //auth mocking
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});

        const transaction1a = {username:"testuser1", amount:"1", type:"ecommerce", date:"30-05-2023", categories_info:{color:"red"}};
        const transaction1b = {username:"testuser1", amount:"1", type:"ecommerce", date:"30-05-2023", categories_info:{color:"red"}};
        const transaction3 = {username:"testuser3", amount:"1", type:"ecommerce", date:"30-05-2023", categories_info:{color:"red"}};

        Group.findOne = jest.fn().mockResolvedValue({members:[user1, user2,user3]});

        User.findOne = jest.fn().mockImplementationOnce(() => {return new Promise((resolve,reject)=>{resolve(user1)})})
            .mockImplementationOnce(() => {return new Promise((resolve,reject)=>{resolve(user2)})})
            .mockImplementationOnce(() => {return new Promise((resolve,reject)=>{resolve(user3)})});

        jest.spyOn(transactions, "aggregate").mockImplementationOnce(() => {return new Promise((resolve,reject)=>{
                resolve([transaction1a, transaction1b]);
        })});
        jest.spyOn(transactions, "aggregate").mockImplementationOnce(() => {return new Promise((resolve,reject)=>{
            resolve({});
        })});
        jest.spyOn(transactions, "aggregate").mockImplementationOnce(() => {return new Promise((resolve,reject)=>{
            resolve([transaction3]);
        })});

        const expectedTransactions = [{username:"testuser1", amount:"1", type:"ecommerce", date:"30-05-2023", color:"red"},
            {username:"testuser1", amount:"1", type:"ecommerce", date:"30-05-2023", color:"red"},
            {username:"testuser3", amount:"1", type:"ecommerce", date:"30-05-2023", color:"red"}];

        const mockReq = {
            //user route
            url:"/api/groups/:name/transactions",
            params:{username:"testuser"},
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {refreshedTokenMessage:"abc"}
        };

        await getTransactionsByGroup(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({data:expectedTransactions, refreshedTokenMessage:mockRes.locals.refreshedTokenMessage});

        //admin route
        mockReq.url="/api/transactions/groups/:name";
        await getTransactionsByGroup(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({data:expectedTransactions, refreshedTokenMessage:mockRes.locals.refreshedTokenMessage});
    });

    test('200 - Returns an empty array, because no user has any transactions', async () => {
        const user1 = {username:"testuser1",email:"u1@mail.com"};
        const user2 = {username:"testuser2",email:"u2@mail.com"};

        //auth mocking
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});

        Group.findOne = jest.fn().mockResolvedValue({members:[user1, user2]});

        User.findOne = jest.fn().mockImplementationOnce(() => {return new Promise((resolve,reject)=>{resolve(user1)})})
            .mockImplementationOnce(() => {return new Promise((resolve,reject)=>{resolve(user2)})});

        jest.spyOn(transactions, "aggregate").mockImplementationOnce(() => {return new Promise((resolve,reject)=>{
                resolve({});
        })});
        jest.spyOn(transactions, "aggregate").mockImplementationOnce(() => {return new Promise((resolve,reject)=>{
            resolve({});
        })});

        const expectedTransactions = []

        const mockReq = {
            //user route
            url:"/api/groups/:name/transactions",
            params:{username:"testuser"},
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {refreshedTokenMessage:"abc"}
        };

        await getTransactionsByGroup(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({data:expectedTransactions, refreshedTokenMessage:mockRes.locals.refreshedTokenMessage});

        //admin route
        mockReq.url="/api/transactions/groups/:name";
        await getTransactionsByGroup(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({data:expectedTransactions, refreshedTokenMessage:mockRes.locals.refreshedTokenMessage});
    });

})

describe("getTransactionsByGroupByCategory", () => { 

    test ('401 - Unathorized access - User not part of group', async()=> {
        jest.spyOn(Group, "findOne").mockImplementation((par) => {return {members:[]}});
        const expectedCause = "Email is not included in the group emails";
        verifyAuth.mockReturnValue({authorized:false, cause:expectedCause});

        const mockReq = {
            url:"/groups/:name/transactions/category/:category",
            params:{name:"testgroup", category:"testcategory"},
            cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await  getTransactionsByGroupByCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
    });

    test ('401 - Unathorized access - Admin', async()=> {
        jest.spyOn(Group, "findOne").mockImplementation((par) => {return {members:[]}});
        const expectedCause = "Not admin role";
        verifyAuth.mockReturnValue({authorized:false, cause:expectedCause});

        const mockReq = {
            url:"/transactions/groups/:name/category/:category",
            params:{name:"testgroup", category:"testcategory"},
            cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await  getTransactionsByGroupByCategory(mockReq,mockRes);
        expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Admin" });
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
    });

    test( '400 - Not an existing group', async () => {
        jest.spyOn(Group, "findOne").mockImplementation((par) => {return null});
        const expectedErrorMessage = "No such Group";

        const mockReq = {
            url:"/groups/:name/transactions/category/:category",
            params:{name:"testgroup", category:"testcategory"},
            cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await getTransactionsByGroupByCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedErrorMessage});

    });

    test( '400 - Not an existing category', async () => {
        jest.spyOn(Group, "findOne").mockImplementation((par) => {return {members:[]}});
        const expectedCause = "Authorized";
        verifyAuth.mockReturnValue({authorized:true, cause:expectedCause});
        jest.spyOn(categories, "findOne").mockImplementation((par) => {return null});
        const expectedErrorMessage = "No such Category";

        const mockReq = {
            url:"/groups/:name/transactions/category/:category",
            params:{name:"testgroup", category:"wrongtestcategory"},
            cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
        };

        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await getTransactionsByGroupByCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedErrorMessage});

    });

    test('200 - Returns a single transactions for each user in group even thought some has more than one', async () => {
        const user1 = {username:"testuser1",email:"u1@mail.com"};
        const user2 = {username:"testuser2",email:"u2@mail.com"};

        //auth mocking
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        jest.spyOn(categories, "findOne").mockImplementation((par) => {return {type:"testcategory", color:"red"}});

        const transaction1a = {username:"testuser1", amount:"1", type:"testcategory", date:"30-05-2023", categories_info:{color:"red"}};
        const transaction1b = {username:"testuser1", amount:"1", type:"ecommerce", date:"30-05-2023", categories_info:{color:"red"}};
        const transaction2 =  {username:"testuser2", amount:"1", type:"testcategory", date:"30-05-2023", categories_info:{color:"yellow"}};

        Group.findOne = jest.fn().mockResolvedValue({members:[user1, user2]});

        User.findOne = jest.fn().mockImplementationOnce(() => {return new Promise((resolve,reject)=>{resolve(user1)})})
            .mockImplementationOnce(() => {return new Promise((resolve,reject)=>{resolve(user2)})})

        jest.spyOn(transactions, "aggregate").mockImplementationOnce(() => {return new Promise((resolve,reject)=>{
                resolve([transaction1a, transaction1b]);
        })});
        jest.spyOn(transactions, "aggregate").mockImplementationOnce(() => {return new Promise((resolve,reject)=>{
            resolve([transaction2]);
        })});

        const expectedTransactions = [{username:"testuser1", amount:"1", type:"testcategory", date:"30-05-2023", color:"red"},
        {username:"testuser2", amount:"1", type:"testcategory", date:"30-05-2023", color:"yellow"}]

        const mockReq = {
            url:"/groups/:name/transactions/category/:category",
            params:{name:"testgroup", category:"testcategory"},
            cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {refreshedTokenMessage:"abc"}
        };

        await  getTransactionsByGroupByCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({data:expectedTransactions, refreshedTokenMessage:mockRes.locals.refreshedTokenMessage});

        //admin route
        mockReq.url="/api/transactions/groups/:name/category/:category";
        await  getTransactionsByGroupByCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({data:expectedTransactions, refreshedTokenMessage:mockRes.locals.refreshedTokenMessage});
    });

    test('200 - Returns a transactions for each user in group, except for one who has no trans of that cat', async () => {
        const user1 = {username:"testuser1",email:"u1@mail.com"};
        const user2 = {username:"testuser2",email:"u2@mail.com"};
        const user3 = {username:"testuser3",email:"u3@mail.com"};

        //auth mocking
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        jest.spyOn(categories, "findOne").mockImplementation((par) => {return {type:"testcategory", color:"red"}});

        const transaction1 = {username:"testuser1", amount:"1", type:"ecommerce", date:"30-05-2023", categories_info:{color:"red"}};
        const transaction2 = {username:"testuser2", amount:"1", type:"testcategory", date:"30-05-2023", categories_info:{color:"red"}};
        const transaction3 = {username:"testuser3", amount:"1", type:"testcategory", date:"30-05-2023", categories_info:{color:"red"}};

        Group.findOne = jest.fn().mockResolvedValue({members:[user1, user2,user3]});

        User.findOne = jest.fn().mockImplementationOnce(() => {return new Promise((resolve,reject)=>{resolve(user1)})})
            .mockImplementationOnce(() => {return new Promise((resolve,reject)=>{resolve(user2)})})
            .mockImplementationOnce(() => {return new Promise((resolve,reject)=>{resolve(user3)})});

        jest.spyOn(transactions, "aggregate").mockImplementationOnce(() => {return new Promise((resolve,reject)=>{
                resolve([transaction1]);
        })});
        jest.spyOn(transactions, "aggregate").mockImplementationOnce(() => {return new Promise((resolve,reject)=>{
            resolve([transaction2]);
        })});
        jest.spyOn(transactions, "aggregate").mockImplementationOnce(() => {return new Promise((resolve,reject)=>{
            resolve([transaction3]);
        })});

        const expectedTransactions = [{username:"testuser2", amount:"1", type:"testcategory", date:"30-05-2023", color:"red"},
            {username:"testuser3", amount:"1", type:"testcategory", date:"30-05-2023", color:"red"}];

        const mockReq = {
            url:"/groups/:name/transactions/category/:category",
            params:{name:"testgroup", category:"testcategory"},
            cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {refreshedTokenMessage:"abc"}
        };

        await  getTransactionsByGroupByCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({data:expectedTransactions, refreshedTokenMessage:mockRes.locals.refreshedTokenMessage});

        //admin route
        mockReq.url="/api/transactions/groups/:name/category/:category";
        await  getTransactionsByGroupByCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({data:expectedTransactions, refreshedTokenMessage:mockRes.locals.refreshedTokenMessage});
    });

    test('200 - Returns an empty array, because no user has any transaction of that category', async () => {
        const user1 = {username:"testuser1",email:"u1@mail.com"};
        const user2 = {username:"testuser2",email:"u2@mail.com"};
        const user3 = {username:"testuser3",email:"u3@mail.com"};

        //auth mocking
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        jest.spyOn(categories, "findOne").mockImplementation((par) => {return {type:"testcategory", color:"red"}});

        const transaction1 = {username:"testuser1", amount:"1", type:"ecommerce", date:"30-05-2023", categories_info:{color:"red"}};
        const transaction2 = {username:"testuser1", amount:"1", type:"ecommerce", date:"30-05-2023", categories_info:{color:"red"}};
        
        Group.findOne = jest.fn().mockResolvedValue({members:[user1, user2, user3]});

        User.findOne = jest.fn().mockImplementationOnce(() => {return new Promise((resolve,reject)=>{resolve(user1)})})
            .mockImplementationOnce(() => {return new Promise((resolve,reject)=>{resolve(user2)})})
            .mockImplementationOnce(() => {return new Promise((resolve,reject)=>{resolve(user3)})});
        jest.spyOn(transactions, "aggregate").mockImplementationOnce(() => {return new Promise((resolve,reject)=>{
                resolve([transaction1]);
        })});
        jest.spyOn(transactions, "aggregate").mockImplementationOnce(() => {return new Promise((resolve,reject)=>{
            resolve([transaction2]);
        })});
        jest.spyOn(transactions, "aggregate").mockImplementationOnce(() => {return new Promise((resolve,reject)=>{
            resolve({});
        })});

        const expectedTransactions = []

        const mockReq = {
            url:"/groups/:name/transactions/category/:category",
            params:{name:"testgroup", category:"testcategory"},
            cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {refreshedTokenMessage:"abc"}
        };

        await  getTransactionsByGroupByCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({data:expectedTransactions, refreshedTokenMessage:mockRes.locals.refreshedTokenMessage});

        //admin route
        mockReq.url="/api/transactions/groups/:name/category/:category";
        await  getTransactionsByGroupByCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({data:expectedTransactions, refreshedTokenMessage:mockRes.locals.refreshedTokenMessage});
    });
})

describe("deleteTransaction", () => { 
    test ('401 - Unathorized access', async()=> {
        //mock auth failed
        const expectedCause = "Mismatched users";
        verifyAuth.mockReturnValue({authorized:false, cause:expectedCause});
        const mockReq = {
            params:{username:"nottestuser"},
            cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await deleteTransaction(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
    });

    test('400 - User not found', async () => {
        //mock auth
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        //mock mongoose schemas
        jest.spyOn(User, "findOne").mockImplementation((par) => {return null});
        //mock req and res
        const mockReq = {
            params:{username:"testuser"},
            body:{_id:"a1"}
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {refreshedTokenMessage:"abc"}
        };
        const expectedErrorMessage ="No such User";

        await deleteTransaction(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error:expectedErrorMessage});

    });

    test('400 - Missing id in body', async () => {
        //mock auth
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        //mock mongoose schemas
        jest.spyOn(User, "find").mockImplementation((par) => {return   {username:"testuser"}});
        //mock req and res
        const mockReq = {
            params:{username:"testuser"},
            body:{}
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {refreshedTokenMessage:"abc"}
        };
        const expectedErrorMessage ="Missing or empty id in request body";

        await deleteTransaction(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error:expectedErrorMessage});

    });

    test('400 - Empty id in body', async () => {
        //mock auth
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        //mock mongoose schemas
        jest.spyOn(User, "find").mockImplementation((par) => {return   {username:"testuser"}});
        //mock req and res
        const mockReq = {
            params:{username:"testuser"},
            body:{ _id:"" }
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {refreshedTokenMessage:"abc"}
        };
        const expectedErrorMessage ="Missing or empty id in request body";

        await deleteTransaction(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error:expectedErrorMessage});

    });

    test('400 - No such transaction for this user', async () => {
        //mock auth
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        //mock mongoose schemas
        jest.spyOn(User, "findOne").mockImplementation((par) => {return   {username:"testuser"}});
        jest.spyOn(transactions, "findOne").mockImplementation((par) => null);
        //mock req and res
        const mockReq = {
            params:{username:"testuser"},
            body:{_id:"a1"}
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {refreshedTokenMessage:"abc"}
        };
        const expectedErrorMessage ="No such transaction for this user";

        await deleteTransaction(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error:expectedErrorMessage});

    });

    test('400 - Unable to delete transaction', async () => {
        //mock auth
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        //mock mongoose schemas
        jest.spyOn(User, "findOne").mockImplementation((par) => {return   {username:"testuser"}});
        jest.spyOn(transactions, "findOne").mockImplementation((par) => {return   {_id:"a1", username:"testuser"}});
        jest.spyOn(transactions, "deleteOne").mockImplementation((par) => {return   {deletedCount:0}});
        //mock req and res
        const mockReq = {
            params:{username:"testuser"},
            body:{_id:"a1"}
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {refreshedTokenMessage:"abc"}
        };
        const expectedErrorMessage ="Something went wrong: Unable to delete the required transaction";

        await deleteTransaction(mockReq, mockRes)
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error:expectedErrorMessage});

    });

    test('200 - Transaction succesfully deleted', async () => {
        //mock auth
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        //mock mongoose schemas
        jest.spyOn(User, "findOne").mockImplementation((par) => {return   {username:"testuser"}});
        jest.spyOn(transactions, "findOne").mockImplementation((par) => {return   {_id:"a1", username:"testuser"}});
        jest.spyOn(transactions, "deleteOne").mockImplementation((par) => {return   {deletedCount:1}});
        //mock req and res
        const mockReq = {
            params:{username:"testuser"},
            body:{_id:"a1"}
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {refreshedTokenMessage:"abc"}
        };
        const expectedResult ={ message: "Transaction deleted" };

        await deleteTransaction(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({data:expectedResult, refreshedTokenMessage:mockRes.locals.refreshedTokenMessage});

    });
})

describe("deleteTransactions", () => { 
    test ('401 - Unathorized access', async()=> {
        //mock auth failed
        const expectedCause = "Not admin role";
        verifyAuth.mockReturnValue({authorized:false, cause:expectedCause});
        const mockReq = {};
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {refreshedTokenMessage:"abc"}
        };

        await deleteTransactions(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
    });

    test('400 - Missing ids in body', async () => {
        //mock auth
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        
        //mock req and res
        const mockReq = {
            params:{username:"testuser"},
            body:{}
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {refreshedTokenMessage:"abc"}
        };
        const expectedErrorMessage ="Missing ids in request body";

        await deleteTransactions(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error:expectedErrorMessage});

    });

    test('400 - Ids cannot be empty', async () => {
        //mock auth
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
       
        //mock req and res
        const mockReq = {
            params:{username:"testuser"},
            body:{_ids:[]}
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {refreshedTokenMessage:"abc"}
        };
        const expectedErrorMessage ="Ids array cannot be empty";

        //v1 empty array
        await deleteTransactions(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error:expectedErrorMessage});

        //v2 empty strings
        mockReq.body = {ids:["lupo","", "cattivo"]}
        await deleteTransactions(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error:expectedErrorMessage});
    });

    test('400 - One or more transactions are not present', async () => {
        //mock auth
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        //mock mongoose schemas
        jest.spyOn(transactions, "find").mockImplementationOnce((par) => null);
        jest.spyOn(transactions, "find").mockImplementationOnce((par) =>[{id:"a1"},{id:"a3"}]);
        //mock req and res
        const mockReq = {
            params:{username:"testuser"},
            body:{_ids:["a1","a2","a3"]}
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {refreshedTokenMessage:"abc"}
        };
        const expectedErrorMessage ="One or more ids don't have a corresponding transaction";

        //when no values are returned
        await deleteTransactions(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error:expectedErrorMessage});
        //when only two are returned
        await deleteTransactions(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error:expectedErrorMessage});
    });

    test('200 - Transactions succesfully deleted', async () => {
        //mock auth
        verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
        //mock mongoose schemas
        jest.spyOn(transactions, "find").mockImplementation((par) =>[{id:"a1"},{id:"a2"},{id:"a3"}]);
        jest.spyOn(transactions, "deleteMany").mockImplementation(() => {return new Promise((resolve,reject)=>{resolve({id:"yes"})})});
        //mock req and res
        const mockReq = {
            params:{username:"testuser"},
            body:{_ids:["a1","a2","a3"]}
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {refreshedTokenMessage:"abc"}
        };
        const expectedResult ={ message: "Transactions deleted" };

        await deleteTransactions(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({data:expectedResult, refreshedTokenMessage:mockRes.locals.refreshedTokenMessage});

    });
})
