import request from 'supertest';
import { app } from '../app';
import { User, Group } from '../models/User.js';
import { categories, transactions } from '../models/model';
import { verifyAuth } from '../controllers/utils';
import { getGroup, getGroups, deleteGroup, addToGroup, removeFromGroup, createGroup } from '../controllers/users';
import { getUser,getUsers,deleteUser } from '../controllers/users';
import jwt from 'jsonwebtoken';

/**
 * In order to correctly mock the calls to external modules it is necessary to mock them using the following line.
 * Without this operation, it is not possible to replace the actual implementation of the external functions with the one
 * needed for the test cases.
 * `jest.mock()` must be called for every external module that is called in the functions under test.
 */
jest.mock("../models/User.js")
//used to avoid using cookies in the test that checks stuff not related to auth
jest.mock('../controllers/utils.js', ()=>({verifyAuth:jest.fn()}));
/**
 * Defines code to be executed before each test case is launched
 * In this case the mock implementation of `User.find()` is cleared, allowing the definition of a new mock implementation.
 * Not doing this `mockClear()` means that test cases may use a mock implementation intended for other test cases.
 */
beforeEach(() => {
  User.find.mockClear();
  Group.findOne.mockClear();
  Group.find.mockClear();
  Group.updateOne.mockClear();
  //additional `mockClear()` must be placed here
});
afterEach(async() => {
  jest.clearAllMocks();
});

const adminToken = "foo"

describe("getUsers", () => {
  beforeEach(async() => {
    User.find.mockClear()
    Group.find.mockClear()
    User.findOne.mockClear()
    Group.findOne.mockClear()
    //additional `mockClear()` must be placed here
  });

  afterEach(async() => {
    jest.clearAllMocks();
  });

  test("401 - Admin authentication failed", async () => {
    const mockReq = {};
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
          refreshedTokenMessage: null
      }
    };
    
    verifyAuth.mockImplementation(() => { return { authorized: false, cause: "Authorized" } });

    
    await getUsers(mockReq, mockRes);

    
    expect(mockRes.status).toHaveBeenCalledWith(401);

  })

  
  test("200 - Return empty list if there are no users", async () => {
    const mockReq = {};
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            refreshedTokenMessage: null
        }
    };
    const output = [];

    
    jest.spyOn(User, "find").mockResolvedValue(output);

    
    verifyAuth.mockImplementation(() => { return { authorized: true, cause: "Authorized" } });

    
    await getUsers(mockReq, mockRes);

    
    expect(User.find).toHaveBeenCalled();

    
    expect(mockRes.status).toHaveBeenCalledWith(200);

    
    expect(mockRes.json).toHaveBeenCalledWith({ data: output, refreshedTokenMessage: mockRes.locals.refreshedTokenMessage });
});


  test("200 - Returns list of all users", async () => {
  const mockReq = {};
  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    locals: {
      refreshedTokenMessage: null
    }
  };
  const retrievedUsers = [
    { username: 'user1', email: 'user1@test.com', role: 'Regular' },
    { username: 'user2', email: 'user2@test.com', role: 'Regular' }
  ];
  const output = [
    { username: 'user1', email: 'user1@test.com', role: 'Regular' },
    { username: 'user2', email: 'user2@test.com', role: 'Regular' }
  ];

  // Mock the User.find method to return the retrievedUsers
  jest.spyOn(User, "find").mockResolvedValue(retrievedUsers);


  verifyAuth.mockImplementation(() => { return { authorized: true, cause: "Authorized" } });


  await getUsers(mockReq, mockRes);


  expect(User.find).toHaveBeenCalled();


  expect(mockRes.status).toHaveBeenCalledWith(200);


  expect(mockRes.json).toHaveBeenCalledWith({ data: output, refreshedTokenMessage: mockRes.locals.refreshedTokenMessage });
  });

})


describe('getUser', () => {
  // This represents the user in the database
  const dbUser = {
    username: 'user1',
    email: 'user1@test.com',
    role: 'Regular'
  };

  // This represents the request made by the user
  const mockReq = (username) => ({
    params: {
      username: username,
    },
    cookies: {
      accessToken: 'validUserToken',
      refreshToken: 'validUserToken',
    },
  });

  const mockRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    locals: {
      refreshedTokenMessage: null
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("200 - Return user data for authenticated user requests", async () => {
    const req = mockReq(dbUser.username);
    const res = mockRes();

    jest.spyOn(User, 'findOne').mockResolvedValue(dbUser);
    verifyAuth.mockImplementation(() => { return { authorized: true } });

    await getUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ data: dbUser, refreshedTokenMessage: res.locals.refreshedTokenMessage });
  });

  test("200 - Return user data for authenticated admin requests", async () => {
    const req = mockReq('otherUser');
    const res = mockRes();

    jest.spyOn(User, 'findOne').mockResolvedValue(dbUser);
    verifyAuth.mockImplementation((req, res, options) => {
      if (options.authType === "Admin") {
        return { authorized: true };
      } else {
        return { authorized: false };
      }
    });

    await getUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ data: dbUser, refreshedTokenMessage: res.locals.refreshedTokenMessage });
  });

  test("400 - User is not found", async () => {
    const req = mockReq('nonExistentUser');
    const res = mockRes();

    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    verifyAuth.mockImplementation(() => { return { authorized: true } });

    await getUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Username not in database!' });
  });
  test("400 - User is not found as admin", async () => {
    const req = mockReq('nonExistentUser');
    const res = mockRes();

    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    verifyAuth.mockImplementation(() => { return { authorized: true } });

    await getUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Username not in database!' });
  });

  test("401 - Request is not authenticated", async () => {
    const req = mockReq(dbUser.username);
    const res = mockRes();

    jest.spyOn(User, 'findOne').mockResolvedValue(dbUser);
    verifyAuth.mockImplementation(() => { return { authorized: false, cause: 'Not authorized' } });

    await getUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not authorized' });
  });
});

describe("createGroup", () => { 
  test ('401 - Unauthorized access', async()=> {
    //mock auth failed
    const expectedCause = "unauthorized";
    verifyAuth.mockReturnValue({authorized:false, cause:expectedCause});
    const mockReq = {

        cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
    };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    await createGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
  });

  test ('400 - Missing name', async()=> {
    //mock auth
    const expectedCause = "Missing or empty parameters";
    verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
    const mockReq = {
        body: {test: "test",
                memberEmails:[
                "test@email.com"
              ]},
        cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
    };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    await createGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
  });

  test ('400 - Empty name', async()=> {
    //mock auth
    const expectedCause = "Missing or empty parameters";
    verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
    const mockReq = {
        body: {name: "",
                memberEmails:[
                "test@email.com"
              ]},
        cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
    };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    await createGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
  });

  test ('400 - Empty parameters', async()=> {
    //mock auth failed
    const expectedCause = "Missing or empty parameters";
    verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
    const mockReq = {
        body: {name: "",
              memberEmails:[
                ""
              ]},
        cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
    };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    await createGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
  });

  test ('400 - Group name already used', async()=> {
    //mock auth
    const expectedCause = "Group name already used";
    verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});


    jwt.verify= jest.fn().mockReturnValue({email: "test@email.com"});  
    jest.spyOn(Group, "findOne").mockResolvedValue({name:"testgroup"});
    const mockReq = {
        body: {name: "test",
              memberEmails:[
                "test@email.com"
              ]},
        cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
    };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    await createGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
  });

  test ('400 - User calling is already in a group', async()=> {
    //mock auth
    const expectedCause = "You are already in a group";
    verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});


    jwt.verify= jest.fn().mockReturnValue({email: "test@email.com"});  
    Group.findOne = jest.fn().mockResolvedValueOnce(null) //doesn't found other group
              .mockResolvedValueOnce({name:"userAlreadyPresentGroup"})
    const mockReq = {
        body: {name: "test",
              memberEmails:[
                "test@email.com"
              ]},
        cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
    };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    await createGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
  });

  test ('400 - One or more emails are empty strings', async()=> {
    //mock auth
    const expectedCause = "Emails cannot be empty";
    verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});


    jwt.verify= jest.fn().mockReturnValue({email: "test@email.com"});  
    Group.findOne = jest.fn().mockResolvedValueOnce(null) //doesn't found other group
              .mockResolvedValueOnce(null)
    const mockReq = {
        body: {name: "test",
              memberEmails:[
                "",
                "test@email.com"
              ]},
        cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
    };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    await createGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
  });

  test ('400 - One or more emails are not in a valid format', async()=> {
    //mock auth
    const expectedCause = "Invalid email format inserted";
    verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});


    jwt.verify= jest.fn().mockReturnValue({email: "test@email.com"});  
    Group.findOne = jest.fn().mockResolvedValueOnce(null) //doesn't found other group
              .mockResolvedValueOnce(null)
    const mockReq = {
        body: {name: "test",
              memberEmails:[
                "test@email.com",
                "notvalidemailFormat"
              ]},
        cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
    };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    await createGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
  });

  test ('400 - All users already in group or do not exist', async()=> {
    //mock auth
    const expectedCause = "Insert valid emails";
    verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});


    jwt.verify= jest.fn().mockReturnValue({email: "test@email.com"});  
    Group.findOne = jest.fn().mockResolvedValueOnce(null) //doesn't find other group
              .mockResolvedValueOnce(null) //doesn't find calling user in another group
              .mockResolvedValueOnce({name:"userAlreadyPresentGroup"}); // finds first user in another group
    User.findOne = jest.fn().mockResolvedValueOnce(null)
      .mockResolvedValueOnce({exists:"true"});
    const mockReq = {
        body: {name: "test",
              memberEmails:[
                "notAUser@email.com",
                "test@email.com",
              ]},
        cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
    };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    await createGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
  });

  test ('200 - Group created correctly', async()=> {
    //mock auth
    verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});


    jwt.verify = jest.fn().mockReturnValue({email: "test@email.com"}); 
    
    const expectedGroup = {name: "test",
    memberEmails:[
    "test@email.com",
    "test1@email.com"
    ]}

    Group.findOne = jest.fn().mockResolvedValueOnce() //check if it already exists
      .mockResolvedValueOnce() //check if calling user is already in a group
      .mockResolvedValueOnce() //check if mail is in other group
      .mockResolvedValueOnce()
      .mockResolvedValueOnce(expectedGroup)
    User.findOne = jest.fn().mockResolvedValue({email: "test1@email.com"});
    Group.prototype.save = jest.fn().mockResolvedValue({name: "test",
    memberEmails:[
    "test@email.com"
    ]});

    const mockReq = {
        body: {name: "test",
              memberEmails:[
                "test@email.com",
                "test1@email.com"
              ]},
        cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
    };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {refreshedTokenMessage:"abc"}
    };

    await createGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      data:{ group: expectedGroup , membersNotFound : [], alreadyInGroup: []},
      refreshedTokenMessage: mockRes.locals.refreshedTokenMessage
  });
  });

  
  test ('200 - Group created correctly and user auto insertion', async()=> {
    //mock auth
    verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});


    jwt.verify = jest.fn().mockReturnValue({email: "caller@email.com"}); 
    
    const expectedGroup = {name: "test",
    memberEmails:[
    "caller@email.com",
    "test1@email.com"
    ]}

    Group.findOne = jest.fn().mockResolvedValueOnce() //check if it already exists
      .mockResolvedValueOnce() //check if calling user is already in a group
      .mockResolvedValueOnce() //check if mail is in other group
      .mockResolvedValueOnce()
      .mockResolvedValueOnce(expectedGroup)
    User.findOne = jest.fn().mockResolvedValue({email: "test1@email.com"});
    Group.prototype.save = jest.fn().mockResolvedValue({name: "test",
    memberEmails:[
    "test@email.com"
    ]});

    const mockReq = {
        body: {name: "test",
              memberEmails:[
                "test@email.com",
                "test1@email.com"
              ]},
        cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
    };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {refreshedTokenMessage:"abc"}
    };

    await createGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      data:{ group: expectedGroup , membersNotFound : [], alreadyInGroup: []},
      refreshedTokenMessage: mockRes.locals.refreshedTokenMessage
  });
  });

})


describe("getGroups", () => { 
  test ('401 - Unauthorized access (not an Admin)', async()=> {
    const expectedCause = "Not admin role";
    verifyAuth.mockReturnValue({authorized:false, cause:expectedCause});

    const mockReq = { cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken" };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    await getGroups(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
  });

  test ('200 - Admin gets all groups', async()=> {
    verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
    
    const GroupsList = [{name: "test", members: [{email: "test@email.com"}]},
      {name: "test1", members: [{email: "test1@email.com"}]}];
    jest.spyOn(Group, "find").mockImplementation(() => {return new Promise((resolve,reject)=>{resolve(GroupsList)})});
    const GroupsListExpected = [{name: "test", members: [{email: "test@email.com"}]},
      {name: "test1", members: [{email: "test1@email.com"}]}];

    const mockReq = { cookies: "accessToken=sampleCorrectAccessToken;refreshToken=sampleCorrectRefreshToken" };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {refreshedTokenMessage:"abc"}
    };

    await getGroups(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({data: GroupsListExpected, refreshedTokenMessage:mockRes.locals.refreshedTokenMessage});
  });

  test ('200 - Admin gets []: no group exists', async()=> {
    verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
    
    const GroupsList = [{name: "test", members: [{email: "test@email.com"}]},
      {name: "test1", members: [{email: "test1@email.com"}]}];
    jest.spyOn(Group, "find").mockImplementationOnce(() => {return new Promise((resolve,reject)=>{resolve([])})});
    const GroupsListExpected = [];

    const mockReq = { cookies: "accessToken=sampleCorrectAccessToken;refreshToken=sampleCorrectRefreshToken" };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {refreshedTokenMessage:"abc"}
    };

    await getGroups(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({data: GroupsListExpected, refreshedTokenMessage:mockRes.locals.refreshedTokenMessage});
  });
})

describe("getGroup", () => { 

  test ('401 - Unauthorized access', async()=> {
    const expectedCause = "Not admin role";
    verifyAuth.mockReturnValue({authorized:false, cause:expectedCause});
    jest.spyOn(Group, "findOne").mockResolvedValue({members:["email@mail.com","email2@mai.com"]})
    const expectError = "Unauthorized";
    const mockReq = { cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken",
                          url:"/api/groups/groupName",
                          params:{name:"test"}, };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };
    
    await getGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({error:expectError});
  });

  test('400 - The group does not exist', async()=> {
    verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
    jest.spyOn(Group, "findOne").mockResolvedValue(null)
    
    const mockReq = { 
      cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken",
      url:"/api/groups/:name",
      params:{name:"test"}
    };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {refreshedTokenMessage:"abc"}
    };
    const expectedCause = "No such Group";
    await getGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
  });

  test('200 - Returns the required group', async()=> {
    verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
    jest.spyOn(Group, "findOne").mockResolvedValueOnce({members: [{email: "test1@email.com"}]})
    jest.spyOn(Group, "findOne").mockResolvedValueOnce({name: "test1", members: [{email: "test1@email.com"}]})
    const mockReq = { cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken",
                          url:"/api/groups/:name",
                          params:{name:"test"}, };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {refreshedTokenMessage:"abc"}
    };
    const expectedResult = {name: "test1", members: [{email: "test1@email.com"}]};
    await getGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({data:expectedResult, refreshedTokenMessage: mockRes.locals.refreshedTokenMessage});
  });

})

describe("addToGroup", () => {

  test('400 - The group does not exist', async()=> {
    
    const expectedCause = "Group not existing";
    jest.spyOn(Group, "findOne").mockResolvedValue(null); 
    const mockReq = {
        params: {name: "test"},
        url:"/api/groups/:name/add",
        cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
    };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    await addToGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
  });


  test ('401 - Unauthorized acces to admin route', async()=> {
    jest.spyOn(Group, "findOne").mockResolvedValue({name:"testgroup"}); 
    //mock auth failed
    const expectedCause = "Not admin role";
    verifyAuth.mockReturnValue({authorized:false, cause:expectedCause});
    const mockReq = {
        url:"/api/groups/:name/insert",
        params:{name:"groupname"},
        cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
    };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    await addToGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
  });

  test ('401 - Unauthorized acces to user route', async()=> {
    jest.spyOn(Group, "findOne").mockResolvedValue({name:"testgroup", members:["f"]}); 
    //mock auth failed
    const expectedCause = "Email is not included in the group emails";
    verifyAuth.mockReturnValue({authorized:false, cause:expectedCause});
    const mockReq = {
        url:"/api/groups/:name/add",
        params:{name:"groupname"},
        cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
    };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    await addToGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
  });

  test ('400 - Missing body attributes', async()=> {
    jest.spyOn(Group, "findOne").mockResolvedValue({name:"testgroup"}); 
    //mock auth failed
    const expectedCause = "Missing and/or empty body attributes";
    verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
    const mockReq = {
        url:"/api/groups/testgroup/insert",
        params:{name:"testgroup"},
        body: {},
        cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
    };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        body: {},
        json: jest.fn(),
    };

    await addToGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
  });

  test ('400 - Emails cannot be empty', async()=> {
    const reqEmails = [""];
    const alreadyEmail = ["test@email"]
    Group.findOne = jest.fn().mockResolvedValueOnce({name:"testgroup"})
    ; 
    //mock auth failed
    const expectedCause = "Emails cannot be empty";
    verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
    const mockReq = {
        url:"/api/groups/testgroup/insert",
        params:{name:"testgroup"},
        body: {emails:reqEmails},
        cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
    };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    await addToGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
  });

  test ('400 - Wrong email format', async()=> {
    const reqEmails = ["wrongformat"];
    const alreadyEmail = ["test@email"]
    Group.findOne = jest.fn().mockResolvedValueOnce({name:"testgroup"})
    ; 
    //mock auth failed
    const expectedCause = "Invalid email format inserted";
    verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
    const mockReq = {
        url:"/api/groups/testgroup/insert",
        params:{name:"testgroup"},
        body: {emails:reqEmails},
        cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
    };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    await addToGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
  });

  test ('400 - All users already in a group or not existing', async()=> {
    const reqEmails = ["testNotExistent@email.com","testPresent@email.com"];
    const alreadyEmail = ["testPresent@email.com"]
    Group.findOne = jest.fn().mockResolvedValueOnce({name:"testgroup"}) //il gruppo esiste
      .mockResolvedValueOnce({name:"presentGroup"}) //testPresent@email.com is in this group

    User.findOne = jest.fn().mockResolvedValueOnce(null) //non esistente
      .mockResolvedValueOnce({username:"desCartes", email:"testPresent@email.com"}) //
    //mock auth failed
    const expectedCause = "Insert valid emails";
    verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
    const mockReq = {
        url:"/api/groups/testgroup/insert",
        params:{name:"testgroup"},
        body: {emails:reqEmails},
        cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
    };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    await addToGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
  });

  test ('200 - Emails successfully inserted into the group', async()=> {

    const reqEmails = ["test1@email.com","test2@email.com"];
    const expectedResult = {name: "test1", members: [{email:"test1@email.com"}, {email:"test2@email.com"}]};
    const mockReq = {
        url:"/api/groups/testgroup/insert",
        params:{name:"testgroup"},
        body: {emails:reqEmails},
        cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
    };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {refreshedTokenMessage: "abc"}
    };

    Group.findOne = jest.fn().mockResolvedValueOnce({name:"testgroup"}) //il gruppo esiste
      .mockResolvedValueOnce(null) //user test1@email.com is in no other group
      .mockResolvedValueOnce(null) //user test1@email.com is in no other group
      .mockResolvedValueOnce(expectedResult);
    Group.updateOne = jest.fn().mockResolvedValueOnce({success:true});
    User.findOne = jest.fn().mockResolvedValue({name:"present"}); //both present
    //mock auth f
    verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
    

    await addToGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({data:{ group: expectedResult , membersNotFound : [], alreadyInGroup: []},
      refreshedTokenMessage: "abc"});
  });
})

describe("removeFromGroup", () => {
  test ('401 - Unauthorized acces to admin route', async()=> {

    jest.spyOn(Group, "findOne").mockResolvedValue({name:"testgroup", members:[{email:"test@email"},{email:"test2@email"}]}); 
    //mock auth failed
    const expectedCause = "Not admin role";
    verifyAuth.mockReturnValue({authorized:false, cause:expectedCause});
    const mockReq = {
        url:"/api/groups/:name/pull",
        params:{name:"testgroup"},
        cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
    };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    await removeFromGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
  });

  test ('401 - Unauthorized acces to user route', async()=> {
    jest.spyOn(Group, "findOne").mockResolvedValue({name:"testgroup", members:[{email:"test@email"},{email:"test2@email"}]}); 
    //mock auth failed
    const expectedCause = "Email is not included in the group emails";
    verifyAuth.mockReturnValue({authorized:false, cause:expectedCause});
    const mockReq = {
        url:"/api/groups/:name/remove",
        params:{name:"testgroup"},
        cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
    };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    await removeFromGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
  });

  test('400 - The group does not exist', async()=> {
    
    const expectedCause = "Group not existing";
    jest.spyOn(Group, "findOne").mockResolvedValue(null); 
    const mockReq = {
        params: {name: "test"},
        url:"/api/groups/:name/remove",
        cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
    };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    await removeFromGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
  });

  test ('400 - Missing body attributes', async()=> {
    jest.spyOn(Group, "findOne").mockResolvedValue({name:"testgroup", members:[{email:"test@email"},{email:"test2@email"}]}); 
    //mock auth failed
    const expectedCause = "Missing and/or empty body attributes";
    verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
    const mockReq = {
        url:"/api/groups/testgroup/insert",
        params:{name:"testgroup"},
        body: {},
        cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
    };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        body: {},
        json: jest.fn(),
    };

    await removeFromGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
  });

  test ('400 - Emails cannot be empty', async()=> {
    const reqEmails = [""];
    const alreadyEmail = ["test@email"]
    Group.findOne = jest.fn().mockResolvedValueOnce({name:"testgroup", members:[{email:"test@email"},{email:"test2@email"}]})
    ; 
    //mock auth failed
    const expectedCause = "Emails cannot be empty";
    verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
    const mockReq = {
        url:"/api/groups/testgroup/remove",
        params:{name:"testgroup"},
        body: {emails:reqEmails},
        cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
    };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    await removeFromGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
  });

  test ('400 - Wrong email format', async()=> {
    const reqEmails = ["wrongformat"];
    const alreadyEmail = ["test@email"]
    Group.findOne = jest.fn().mockResolvedValueOnce({name:"testgroup", members:[{email:"test@email"},{email:"test2@email"}]})
    ; 
    //mock auth failed
    const expectedCause = "Invalid email format inserted";
    verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
    const mockReq = {
        url:"/api/groups/testgroup/pull",
        params:{name:"testgroup"},
        body: {emails:reqEmails},
        cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
    };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    await removeFromGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
  });

  test ('400 - All users already in a group or not existing', async()=> {
    const reqEmails = ["testNotExistent@email.com","testPresent@email.com"];
    const alreadyEmail = ["testPresent@email.com"]
    Group.findOne = jest.fn().mockResolvedValueOnce({name:"testgroup", members:[{email:"test@email"},{email:"test2@email"}]}) //il gruppo esiste
      .mockResolvedValueOnce({name:"presentGroup"}) //testPresent@email.com is in this group

    User.findOne = jest.fn().mockResolvedValueOnce(null) //non esistente
      .mockResolvedValueOnce({username:"desCartes", email:"testPresent@email.com"}) //
    //mock auth failed
    const expectedCause = "None of the emails are in this group";
    verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
    const mockReq = {
        url:"/api/groups/testgroup/remove",
        params:{name:"testgroup"},
        body: {emails:reqEmails},
        cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
    };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    await removeFromGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
  });

  test ('400 - Only one member', async()=> {
    const reqEmails = ["test@email"];
    const alreadyEmail = ["test@email"]
    Group.findOne = jest.fn().mockResolvedValueOnce({name:"testgroup", members:[{email:"test@email"}]}); 
    //mock auth failed
    const expectedCause = "Cannot remove members from a group with only one user";
    verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
    const mockReq = {
        url:"/api/groups/testgroup/pull",
        params:{name:"testgroup"},
        body: {emails:reqEmails},
        cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
    };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    await removeFromGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
  });

  test ('200 - Succesfully removed members from group', async()=> {
    const reqEmails = ["test@email.com"];
    const expectedResult ={name:"testgroup", members:[{email:"test@email.com"}]};
    Group.findOne = jest.fn().mockResolvedValueOnce({name:"testgroup", members:[{email:"test@email.com"},{email:"test2@email.com"}]}) //il gruppo esiste
      .mockResolvedValueOnce({name:"testgroup"}) //test@email.com is in this group
      .mockResolvedValueOnce(expectedResult) //final call
    Group.updateOne = jest.fn().mockResolvedValue({updated:"true"});

    User.findOne = jest.fn().mockResolvedValueOnce({email:"test@email"}) //non esistente

    //mock auth failed
    verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
    const mockReq = {
        url:"/api/groups/testgroup/remove",
        params:{name:"testgroup"},
        body: {emails:reqEmails},
        cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
    };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals:{refreshedTokenMessage:"abc"}
    };

    await removeFromGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      data:{ group:expectedResult, membersNotFound :[], notInGroup:[]},
      refreshedTokenMessage: mockRes.locals.refreshedTokenMessage
    });
  });

  test ('200 - Succesfully deleted members - keep the first because #members == #emails', async()=> {
    const reqEmails = ["test@email.com","test2@email.com"];
    const expectedResult ={name:"testgroup", members:[{email:"test2@email.com"}]};
    Group.findOne = jest.fn().mockResolvedValueOnce({name:"testgroup", members:[{email:"test@email.com"},{email:"test2@email.com"}]}) //il gruppo esiste
      .mockResolvedValueOnce({name:"testgroup"}) //test@email.com is in this group
      .mockResolvedValueOnce({name:"testgroup"}) //test2@email.com is in this group
      .mockResolvedValueOnce(expectedResult) //final call
    Group.updateOne = jest.fn().mockResolvedValue({updated:"true"});

    User.findOne = jest.fn().mockResolvedValueOnce({email:"test@email"})
                .mockResolvedValueOnce({email:"test2@email"})

    //mock auth failed
    verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
    const mockReq = {
        url:"/api/groups/testgroup/remove",
        params:{name:"testgroup"},
        body: {emails:reqEmails},
        cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken"
    };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals:{refreshedTokenMessage:"abc"}
    };

    await removeFromGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      data:{ group:expectedResult, membersNotFound :[], notInGroup:[]},
      refreshedTokenMessage: mockRes.locals.refreshedTokenMessage
    });
  });

})

describe('deleteUser', () => {
  // This represents the user in the database
  const dbUser = {
    _id: 'userId',
    email: 'user1@test.com',
    role: 'Regular',
    username: 'user1',
  };

  // This represents the request made by the user
  const mockReq = (email) => ({
    body: {
      email: email,
    },
    cookies: {
      accessToken: 'validAdminToken',
      refreshToken: 'validAdminToken',
    },
  });

  const mockRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    locals: {
      refreshedTokenMessage: null
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("200 - Delete a user and return the number of deleted transactions and whether the user was deleted from a group", async () => {
    const req = mockReq(dbUser.email);
    const res = mockRes();

    jest.spyOn(User, 'findOne').mockResolvedValue(dbUser);
    jest.spyOn(User, 'deleteOne').mockResolvedValue({ deletedCount: 1 });
    jest.spyOn(transactions, 'deleteMany').mockResolvedValue({ deletedCount: 5 });
    jest.spyOn(Group, 'updateMany').mockResolvedValue({ modifiedCount: 1 });
    jest.spyOn(Group, 'deleteMany').mockResolvedValue({ deletedCount: 0 });
    verifyAuth.mockImplementation(() => { return { authorized: true } });

    await deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      data: {
        deletedTransactions: 5,
        deletedFromGroup: true
      },
      refreshedTokenMessage: res.locals.refreshedTokenMessage,
    });
  });

  test("400 - Cannot delete admin ", async () => {
    const req = mockReq('admin@test.com');
    const res = mockRes();
    
    const adminUser = {...dbUser, role: 'Admin'};
    
    jest.spyOn(User, 'findOne').mockResolvedValue(adminUser);
    verifyAuth.mockImplementation(() => { return { authorized: true } });

    await deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Cannot delete an admin this way' });
  });

  test("400 - User not found", async () => {
    const req = mockReq('nonExistentUser@test.com');
    const res = mockRes();

    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    verifyAuth.mockImplementation(() => { return { authorized: true } });

    await deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Email not in database' });
  });

  test("401 - Request is not authenticated", async () => {
    const req = mockReq(dbUser.email);
    const res = mockRes();

    verifyAuth.mockImplementation(() => { return { authorized: false, cause: 'Not authorized' } });

    await deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not authorized' });
  });

  test("400 - Email is not provided", async () => {
    const req = mockReq(null);
    const res = mockRes();
    verifyAuth.mockImplementation(() => { return { authorized: true } });
    await deleteUser(req, res);
  
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'All attributes are required' });
  });
  
  test("400 - Email format is invalid", async () => {
    const req = mockReq('invalidEmail');
    const res = mockRes();
    verifyAuth.mockImplementation(() => { return { authorized: true } });
    await deleteUser(req, res);
  
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid email format' });
  });

  test("400 - Email format is empty string", async () => {
    const req = mockReq(' ');
    const res = mockRes();
    verifyAuth.mockImplementation(() => { return { authorized: true } });
    await deleteUser(req, res);
  
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Parameters cannot be empty" });
  });

  
  
  

});


describe("deleteGroup", () => {

  test ('401 - Unauthorized access - not an Admin', async()=> {
    const expectedCause = "Not admin role";
    verifyAuth.mockReturnValue({authorized:false, cause:expectedCause});

    const mockReq = { cookies: "accessToken=sampleWrongAccessToken;refreshToken=sampleWrongRefreshToken" };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    await deleteGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({error: expectedCause});
  });

  test ('400 - Admin did not insert all necessary data', async()=> {
    verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
    
    const expectedCause = "Not all the necessary data was inserted";

    const mockReq = { body:{},
      cookies: "accessToken=sampleCorrectAccessToken;refreshToken=sampleCorrectRefreshToken" };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {refreshedTokenMessage:"abc"}
    };


    await deleteGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
  });

  test ('400 - Admin insert an empty string as a name', async()=> {
    verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
    
    const expectedCause = "The group name is an empty string";

    const mockReq = { body:{name:""},
      cookies: "accessToken=sampleCorrectAccessToken;refreshToken=sampleCorrectRefreshToken" };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {refreshedTokenMessage:"abc"}
    };


    await deleteGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
  });

  test ('400 - Admin inserts the name of a group that does not exist', async()=> {
    verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});
    
    const expectedCause = "The group does not exist";

    Group.findOne = jest.fn().mockResolvedValueOnce(null);

    const mockReq = { body:{name:"test"},
      cookies: "accessToken=sampleCorrectAccessToken;refreshToken=sampleCorrectRefreshToken" };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {refreshedTokenMessage:"abc"}
    };


    await deleteGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error:expectedCause});
  });

  test ('200 - The group is deleted by the admin', async()=> {
    verifyAuth.mockReturnValue({authorized:true, cause:"Authorized"});

    jest.spyOn(Group, "findOne").mockImplementation((par) =>[{name: "test1", members: [{email: "test1@email.com"}]}]);
    jest.spyOn(Group, "deleteOne").mockImplementation((par) => {return   {deletedCount:1}});

    const mockReq = { body:{ name : "test1"},
      cookies: "accessToken=sampleCorrectAccessToken;refreshToken=sampleCorrectRefreshToken" };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {refreshedTokenMessage:"abc"}
    };
    const expectedResult ={ message: "Group deleted succesfully" };

    await deleteGroup(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({data:expectedResult, refreshedTokenMessage: mockRes.locals.refreshedTokenMessage});
  });

})