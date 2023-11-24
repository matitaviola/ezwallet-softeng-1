
import request from 'supertest';
import { app } from '../app';
import { User, Group } from '../models/User.js';
import { transactions, categories } from '../models/model';
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

/**
 * Necessary setup in order to create a new database for testing purposes before starting the execution of test cases.
 * Each test suite has its own database in order to avoid different tests accessing the same database at the same time and expecting different data.
 */
dotenv.config();
beforeAll(async () => {
  const dbName = "testingDatabaseUsers";
  const url = `${process.env.MONGO_URI}/${dbName}`;

  await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

});

/**
 * After all test cases have been executed the database is deleted.
 * This is done so that subsequent executions of the test suite start with an empty database.
 */
afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  await categories.deleteMany({});
  await transactions.deleteMany({});
  await User.deleteMany({});
  await Group.deleteMany({});
})

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

describe("getUsers", () => {
  /**
   * Database is cleared before each test case, in order to allow insertion of data tailored for each specific test case.
   */
  beforeEach(async () => {
    await User.deleteMany({})
  })

  test("Returns 401 user is not admin", (done) => {
    request(app)
      .get("/api/users")
      .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
      .then((response) => {
        expect(response.status).toBe(401)
        done()
      })
      .catch((err) => done(err))
  })

  test("Returns 200 empty list if there are no users", (done) => {
    request(app)
      .get("/api/users")
      .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
      .then((response) => {
        expect(response.status).toBe(200)
        expect(response.body.data).toHaveLength(0)
        done()
      })
      .catch((err) => done(err))
  })

  test("Returns 200 retrieve list of all users", (done) => {
    User.create({
      username: "tester",
      email: "test@test.com",
      password: "tester",
    }).then(() => {
      request(app)
        .get("/api/users")
        .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
        .then((response) => {
          expect(response.status).toBe(200)
          expect(response.body.data).toHaveLength(1)
          expect(response.body.data[0].username).toEqual("tester")
          expect(response.body.data[0].email).toEqual("test@test.com")
          done() // Notify Jest that the test is complete
        })
        .catch((err) => done(err))
    })
  })
})

describe("getUser", () => {
  /**
   * Database is cleared before each test case, in order to allow insertion of data tailored for each specific test case.
   */
  beforeEach(async () => {
    await User.deleteMany({})
  })

  test("Returns 400 there are no users", (done) => {
    request(app)
      .get("/api/users/non_existent_user")
      .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
      .then((response) => {
        expect(response.status).toBe(400)
        done()
      })
      .catch((err) => done(err))
  })

  test("Returns 401 user is not admin", (done) => {
    request(app)
      .get("/api/users/test")
      .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
      .then((response) => {
        expect(response.status).toBe(401)
        done()
      })
      .catch((err) => done(err))
  })
  test("Returns 200 retrieve user as an admin",(done) =>{
    User.create({
      username: "tester",
      email : "test@test.com",
      password: "tester",
      role : "Admin"

    }).then(() =>{
      request(app)
      .get("/api/users/tester")
       .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
        .then((response) => {
          expect(response.status).toBe(200)
          expect(response.body.data.username).toEqual("tester")
          expect(response.body.data.email).toEqual("test@test.com")
          expect(response.body.data.role).toEqual("Admin")
          done() // Notify Jest that the test is complete
  })
  .catch((err) => done(err))
 })
  })
  test("Returns 200 retrieve itself",(done) =>{
    User.create({
      username: "tester",
      email : "test@test.com",
      password: "tester",
      role : "Regular"

    }).then(() =>{
      request(app)
      .get("/api/users/tester")
       .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
        .then((response) => {
          expect(response.status).toBe(200)
          expect(response.body.data.username).toEqual("tester")
          expect(response.body.data.email).toEqual("test@test.com")
          expect(response.body.data.role).toEqual("Regular")
          done() // Notify Jest that the test is complete
  })
  .catch((err) => done(err))
 })
  })

  test("Returns 401 retrieves ONLY itself as User" ,(done) =>{
    
    User.create({
      username: "tester1",
      email : "test1@test.com",
      password: "tester1",
      role : "Regular"
    })

    User.create({
      username: "tester",
      email : "test@test.com",
      password: "tester",
      role : "Regular"

    }).then(() =>{
      request(app)
      .get("/api/users/tester1")
       .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
        .then((response) => {
          expect(response.status).toBe(401)


          done() // Notify Jest that the test is complete
  })
  .catch((err) => done(err))
 })
  })
})

describe("createGroup", () => { 

  test("Returns 401 because the calling user is not auhtenticated", (done) => {
    Group.create({
      name: "test",
      members: [{email: "test1@email.com"},{email: "test2@email.com"}]
    }).then(() => {
      User.insertMany([
        {username: "test1",
        email: "test1@email.com",
        password: "test1"},
        {username: "test2",
        email: "test2@email.com",
        password: "test2"},
        {username: "test3",
        email: "test3@email.com",
        password: "test3"},
        {username: "test4",
        email: "test4@email.com",
        password: "test4"},
        {username: "test5",
        email: "test5@email.com",
        password: "test5"},
        {username: "admin",
          email: "admin@email.com",
          password: "admin",
          refreshToken: adminAccessTokenValid,
          role: "Admin"}
      ]).then(() => {
        request(app)
        .post("/api/groups")
        .send({name: "testCreate", memberEmails:["test3@email.com","test4@email.com"]})
        .then((response) => {
            expect(response.status).toBe(401)
            expect(response.body.error).toBe("Unauthorized")
            done()
        })
        .catch((err) => done(err))
       })
    })
  })

  test("Returns 401 because the calling user is not auhtenticated", (done) => {
    Group.create({
      name: "test",
      members: [{email: "admin@email.com"},{email: "test2@email.com"}]
    }).then(() => {
      User.insertMany([
        {username: "test1",
        email: "test1@email.com",
        password: "test1"},
        {username: "test2",
        email: "test2@email.com",
        password: "test2"},
        {username: "test3",
        email: "test3@email.com",
        password: "test3"},
        {username: "test4",
        email: "test4@email.com",
        password: "test4"},
        {username: "test5",
        email: "test5@email.com",
        password: "test5"},
        {username: "admin",
          email: "admin@email.com",
          password: "admin",
          refreshToken: adminAccessTokenValid,
          role: "Admin"}
      ]).then(() => {
        request(app)
        .post("/api/groups")
        .send({name: "testCreate", memberEmails:["test3@email.com","test4@email.com"]})
        .then((response) => {
            expect(response.status).toBe(401)
            expect(response.body.error).toBe("Unauthorized")
            done()
        })
        .catch((err) => done(err))
       })
    })
  })

  test("Returns 400 because some data is missing", (done) => {
    Group.create({
      name: "test",
      members: [{email: "test1@email.com"},{email: "test2@email.com"}]
    }).then(() => {
      User.insertMany([
        {username: "test1",
        email: "test1@email.com",
        password: "test1"},
        {username: "test2",
        email: "test2@email.com",
        password: "test2"},
        {username: "test3",
        email: "test3@email.com",
        password: "test3"},
        {username: "test4",
        email: "test4@email.com",
        password: "test4"},
        {username: "test5",
        email: "test5@email.com",
        password: "test5"},
        {username: "admin",
          email: "admin@email.com",
          password: "admin",
          refreshToken: adminAccessTokenValid,
          role: "Admin"}
      ]).then(() => {
        request(app)
        .post("/api/groups")
        .send({test: "testCreate", memberEmails:["test3@email.com","test4@email.com"]})
        .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(400)
            expect(response.body.error).toBe("Missing or empty parameters")
            done()
        })
        .catch((err) => done(err))
       })
    })
  })
  
  test("Returns 400 because some name is empty", (done) => {
    Group.create({
      name: "test",
      members: [{email: "test1@email.com"},{email: "test2@email.com"}]
    }).then(() => {
      User.insertMany([
        {username: "test1",
        email: "test1@email.com",
        password: "test1"},
        {username: "test2",
        email: "test2@email.com",
        password: "test2"},
        {username: "test3",
        email: "test3@email.com",
        password: "test3"},
        {username: "test4",
        email: "test4@email.com",
        password: "test4"},
        {username: "test5",
        email: "test5@email.com",
        password: "test5"},
        {username: "admin",
          email: "admin@email.com",
          password: "admin",
          refreshToken: adminAccessTokenValid,
          role: "Admin"}
      ]).then(() => {
        request(app)
        .post("/api/groups")
        .send({name: "", memberEmails:["test3@email.com","test4@email.com"]})
        .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(400)
            expect(response.body.error).toBe("Missing or empty parameters")
            done()
        })
        .catch((err) => done(err))
       })
    })
  })

  test("Returns 400 because some memberEmails is empty", (done) => {
    Group.create({
      name: "test",
      members: [{email: "test1@email.com"},{email: "test2@email.com"}]
    }).then(() => {
      User.insertMany([
        {username: "test1",
        email: "test1@email.com",
        password: "test1"},
        {username: "test2",
        email: "test2@email.com",
        password: "test2"},
        {username: "test3",
        email: "test3@email.com",
        password: "test3"},
        {username: "test4",
        email: "test4@email.com",
        password: "test4"},
        {username: "test5",
        email: "test5@email.com",
        password: "test5"},
        {username: "admin",
          email: "admin@email.com",
          password: "admin",
          refreshToken: adminAccessTokenValid,
          role: "Admin"}
      ]).then(() => {
        request(app)
        .post("/api/groups")
        .send({name: "testCreate", memberEmails:[]})
        .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(400)
            expect(response.body.error).toBe("Missing or empty parameters")
            done()
        })
        .catch((err) => done(err))
       })
    })
  })

  test("Returns 400 because an email is empty", (done) => {
    Group.create({
      name: "test",
      members: [{email:"test1@email.com"},{email:"test2@email.com"}]
    }).then(() => {
      User.insertMany([
        {username: "test1",
        email: "test1@email.com",
        password: "test1"},
        {username: "test2",
        email: "test2@email.com",
        password: "test2"},
        {username: "test3",
        email: "test3@email.com",
        password: "test3"},
        {username: "test4",
        email: "test4@email.com",
        password: "test4"},
        {username: "test5",
        email: "test5@email.com",
        password: "test5"},
        {username: "admin",
          email: "admin@email.com",
          password: "admin",
          refreshToken: adminAccessTokenValid,
          role: "Admin"}
      ]).then(() => {
        request(app)
        .post("/api/groups")
        .send({name: "testGroup", memberEmails:[ "","test4@email.com"]})
        .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(400)
            expect(response.body.error).toBe("Emails cannot be empty")
            done()
        })
        .catch((err) => done(err))
       })
    })
  })

  test("Returns 400 because an email is empty", (done) => {
    Group.create({
      name: "test",
      members: [{email:"test1@email.com"},{email:"test2@email.com"}]
    }).then(() => {
      User.insertMany([
        {username: "test1",
        email: "test1@email.com",
        password: "test1"},
        {username: "test2",
        email: "test2@email.com",
        password: "test2"},
        {username: "test3",
        email: "test3@email.com",
        password: "test3"},
        {username: "test4",
        email: "test4@email.com",
        password: "test4"},
        {username: "test5",
        email: "test5@email.com",
        password: "test5"},
        {username: "admin",
          email: "admin@email.com",
          password: "admin",
          refreshToken: adminAccessTokenValid,
          role: "Admin"}
      ]).then(() => {
        request(app)
        .post("/api/groups")
        .send({name: "testGroup", memberEmails:["IAmAString","test4@email.com"]})
        .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(400)
            expect(response.body.error).toBe("Invalid email format inserted")
            done()
        })
        .catch((err) => done(err))
       })
    })
  })
  test("Returns 400 because the group name is already used", (done) => {
    Group.create({
      name: "test",
      members: [{email: "test1@email.com"},{email: "test2@email.com"}]
    }).then(() => {
      User.insertMany([
        {username: "test1",
        email: "test1@email.com",
        password: "test1"},
        {username: "test2",
        email: "test2@email.com",
        password: "test2"},
        {username: "test3",
        email: "test3@email.com",
        password: "test3"},
        {username: "test4",
        email: "test4@email.com",
        password: "test4"},
        {username: "test5",
        email: "test5@email.com",
        password: "test5"},
        {username: "admin",
          email: "admin@email.com",
          password: "admin",
          refreshToken: adminAccessTokenValid,
          role: "Admin"}
      ]).then(() => {
        request(app)
        .post("/api/groups")
        .send({name: "test", memberEmails:["IAmAString","test4@email.com"]})
        .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(400)
            expect(response.body.error).toBe("Group name already used")
            done()
        })
        .catch((err) => done(err))
       })
    })
  })

  test("Returns 400 because the user is already in a group", (done) => {
    Group.create({
      name: "test",
      members: [{email: "admin@email.com"},{email: "test2@email.com"}]
    }).then(() => {
      User.insertMany([
        {username: "test1",
        email: "test1@email.com",
        password: "test1"},
        {username: "test2",
        email: "test2@email.com",
        password: "test2"},
        {username: "test3",
        email: "test3@email.com",
        password: "test3"},
        {username: "test4",
        email: "test4@email.com",
        password: "test4"},
        {username: "test5",
        email: "test5@email.com",
        password: "test5"},
        {username: "admin",
          email: "admin@email.com",
          password: "admin",
          refreshToken: adminAccessTokenValid,
          role: "Admin"}
      ]).then(() => {
        request(app)
        .post("/api/groups")
        .send({name: "testCreate", memberEmails:["admin@email.com","test4@email.com"]})
        .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(400)
            expect(response.body.error).toBe("You are already in a group")
            done()
        })
        .catch((err) => done(err))
       })
    })
  })

  test("Returns 400 because the user inserted all invalid emails", (done) => {
    Group.create({
      name: "test",
      members: [{email: "test@email.com"},{email: "test2@email.com"}]
    }).then(() => {
      User.insertMany([
        {username: "test1",
        email: "test1@email.com",
        password: "test1"},
        {username: "test2",
        email: "test2@email.com",
        password: "test2"},
        {username: "test3",
        email: "test3@email.com",
        password: "test3"},
        {username: "test4",
        email: "test4@email.com",
        password: "test4"},
        {username: "test5",
        email: "test5@email.com",
        password: "test5"},
        {username: "admin",
          email: "admin@email.com",
          password: "admin",
          refreshToken: adminAccessTokenValid,
          role: "Admin"}
      ]).then(() => {
        request(app)
        .post("/api/groups")
        .send({name: "testCreate", memberEmails:["test2@email.com"]})
        .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(400)
            expect(response.body.error).toBe("Insert valid emails")
            done()
        })
        .catch((err) => done(err))
       })
    })
  })

  test("Returns 200 Group created correctly", (done) => {
    Group.create({
      name: "test",
      members: [{email: "test1@email.com"},{email: "test2@email.com"}]
    }).then(() => {
      User.insertMany([
        {username: "test1",
        email: "test1@email.com",
        password: "test1"},
        {username: "test2",
        email: "test2@email.com",
        password: "test2"},
        {username: "test3",
        email: "test3@email.com",
        password: "test3"},
        {username: "test4",
        email: "test4@email.com",
        password: "test4"},
        {username: "test5",
        email: "test5@email.com",
        password: "test5"},
        {username: "admin",
          email: "admin@email.com",
          password: "admin",
          refreshToken: adminAccessTokenValid,
          role: "Admin"}
      ]).then(() => {
        request(app)
        .post("/api/groups")
        .send({name: "testCreate", memberEmails:["test3@email.com"]})
        .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(200)
            expect(response.body.data.group).toStrictEqual({name: "testCreate", members:[{email:"test3@email.com"},{email:"admin@email.com"}]})
            expect(response.body.data.alreadyInGroup).toHaveLength(0)
            expect(response.body.data.membersNotFound).toHaveLength(0)
            done()
        })
        .catch((err) => done(err))
       })
    })
  })

  test("Returns 200 Group created correctly with an email not existing", (done) => {
    Group.create({
      name: "test",
      members: [{email: "test1@email.com"},{email: "test2@email.com"}]
    }).then(() => {
      User.insertMany([
        {username: "test1",
        email: "test1@email.com",
        password: "test1"},
        {username: "test2",
        email: "test2@email.com",
        password: "test2"},
        {username: "test3",
        email: "test3@email.com",
        password: "test3"},
        {username: "test4",
        email: "test4@email.com",
        password: "test4"},
        {username: "test5",
        email: "test5@email.com",
        password: "test5"},
        {username: "admin",
          email: "admin@email.com",
          password: "admin",
          refreshToken: adminAccessTokenValid,
          role: "Admin"}
      ]).then(() => {
        request(app)
        .post("/api/groups")
        .send({name: "testCreate", memberEmails:["test3@email.com","test8@email.com"]})
        .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(200)
            expect(response.body.data.group).toStrictEqual({name: "testCreate", members:[{email:"test3@email.com"},{email:"admin@email.com"}]})
            expect(response.body.data.alreadyInGroup).toHaveLength(0)
            expect(response.body.data.membersNotFound).toHaveLength(1)
            done()
        })
        .catch((err) => done(err))
       })
    })
  })

  test("Returns 200 Group created correctly with an email already in a group", (done) => {
    Group.create({
      name: "test",
      members: [{email: "test1@email.com"},{email: "test2@email.com"}]
    }).then(() => {
      User.insertMany([
        {username: "test1",
        email: "test1@email.com",
        password: "test1"},
        {username: "test2",
        email: "test2@email.com",
        password: "test2"},
        {username: "test3",
        email: "test3@email.com",
        password: "test3"},
        {username: "test4",
        email: "test4@email.com",
        password: "test4"},
        {username: "test5",
        email: "test5@email.com",
        password: "test5"},
        {username: "admin",
          email: "admin@email.com",
          password: "admin",
          refreshToken: adminAccessTokenValid,
          role: "Admin"}
      ]).then(() => {
        request(app)
        .post("/api/groups")
        .send({name: "testCreate", memberEmails:["test3@email.com","test2@email.com"]})
        .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(200)
            expect(response.body.data.group).toStrictEqual({name: "testCreate", members:[{email:"test3@email.com"},{email:"admin@email.com"}]})
            expect(response.body.data.alreadyInGroup).toHaveLength(1)
            expect(response.body.data.membersNotFound).toHaveLength(0)
            done()
        })
        .catch((err) => done(err))
       })
    })
  }) 

  test("Returns 200 Group created correctly with an email not eixsting and an email already in a group", (done) => {
    Group.create({
      name: "test",
      members: [{email: "test1@email.com"},{email: "test2@email.com"}]
    }).then(() => {
      User.insertMany([
        {username: "test1",
        email: "test1@email.com",
        password: "test1"},
        {username: "test2",
        email: "test2@email.com",
        password: "test2"},
        {username: "test3",
        email: "test3@email.com",
        password: "test3"},
        {username: "test4",
        email: "test4@email.com",
        password: "test4"},
        {username: "test5",
        email: "test5@email.com",
        password: "test5"},
        {username: "admin",
          email: "admin@email.com",
          password: "admin",
          refreshToken: adminAccessTokenValid,
          role: "Admin"}
      ]).then(() => {
        request(app)
        .post("/api/groups")
        .send({name: "testCreate", memberEmails:["admin@email.com","test3@email.com","test2@email.com","test8@email.com"]})
        .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(200)
            expect(response.body.data.group).toStrictEqual({name: "testCreate", members:[{email:"admin@email.com"},{email:"test3@email.com"}]})
            expect(response.body.data.alreadyInGroup).toHaveLength(1)
            expect(response.body.data.membersNotFound).toHaveLength(1)
            done()
        })
        .catch((err) => done(err))
       })
    })
  }) 
})

describe("getGroups", () => {   
  test("Returns 401 because the calling user is not an admin", (done) => {
    Group.create({
      name: "test",
      members: [{email: "test1@email.com"},{email: "test2@email.com"}]
    }).then(() => {
      User.create({
        username: "admin",
        email: "admin@email.com",
        password: "admin",
        refreshToken: adminAccessTokenValid,
        role: "Admin"
      }).then(() => {
        request(app)
        .get("/api/groups")
        .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(401)
            expect(response.body.error).toBe("Not admin role")
            done()
        })
        .catch((err) => done(err))
       })
    })
  })

  test("Returns 200 all the groups", (done) => {
    Group.insertMany([{
      name: "test1",
      members: [{email: "test1@email.com"},{email: "test2@email.com"}]
    },{
      name: "test2",
      members: [{email: "test3@email.com"},{email: "test4@email.com"}]
    }]).then(() => {
        request(app)
        .get("/api/groups")
        .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(200)
            expect(response.body.data[0]).toStrictEqual({name: "test1", members: [{email: "test1@email.com"},{email: "test2@email.com"}]})
            expect(response.body.data[1]).toStrictEqual({name: "test2", members: [{email: "test3@email.com"},{email: "test4@email.com"}]})
            done()})
        .catch((err) => done(err))
       })
    })


  test("Returns 200 all the groups, but it's an empty array ", (done) => {
      User.create({
        username: "admin",
        email: "admin@email.com",
        password: "admin",
        refreshToken: adminAccessTokenValid,
        role: "Admin"
      }).then(() => {
        request(app)
        .get("/api/groups")
        .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(200)
            expect(response.body.data).toHaveLength(0)
            done()
        })
        .catch((err) => done(err))
       })
    })
})

describe("getGroup", () => { 
  test("Returns 401 because the calling user is not an admin", (done) => {
    Group.create({
      name: "test",
      members: [{email: "test1@email.com"},{email: "test2@email.com"}]
    }).then(() => {
      User.create({
        username: "admin",
        email: "admin@email.com",
        password: "admin",
        refreshToken: adminAccessTokenValid,
        role: "Admin"
      }).then(() => {
        request(app)
        .get("/api/groups/test")
        .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(401)
            expect(response.body.error).toBe("Unauthorized")
            done() 
        })
        .catch((err) => done(err))
       })
    })
  })
  test("Returns 401 because the calling user is not in the group", (done) => {
    Group.create({
      name: "test",
      members: [{email: "test1@email.com"},{email: "test2@email.com"}]
    }).then(() => {
      User.create({
        username: "admin",
        email: "admin@email.com",
        password: "admin",
        refreshToken: adminAccessTokenValid,
        role: "Admin"
      }).then(() => {
        request(app)
        .get("/api/groups/test")
        .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(401)
            expect(response.body.error).toBe("Unauthorized")
            done() 
        })
        .catch((err) => done(err))
       })
    })
  })
  test("Returns 400 because the group name does not exist", (done) => {
    Group.create({
      name: "test",
      members: [{email: "test1@email.com"},{email: "test2@email.com"}]
    }).then(() => {
      User.create({
        username: "admin",
        email: "admin@email.com",
        password: "admin",
        refreshToken: adminAccessTokenValid,
        role: "Admin"
      }).then(() => {
        request(app)
        .get("/api/groups/test1")
        .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(400)
            expect(response.body.error).toBe("No such Group")
            done() 
        })
        .catch((err) => done(err))
       })
    })
  })

  test("Returns 200 the group - admin call", (done) => {
    Group.create({
      name: "test1",
      members: [{email: "test1@email.com"},{email: "test2@email.com"}]
    }).then(() => {
      User.create({
        username: "admin",
        email: "admin@email.com",
        password: "admin",
        refreshToken: adminAccessTokenValid,
        role: "Admin"
      }).then(() => {
        request(app)
        .get("/api/groups/test1")
        .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(200)
            expect(response.body.data).toStrictEqual({name: "test1", members: [{email: "test1@email.com"},{email: "test2@email.com"}]})
            done() 
        })
        .catch((err) => done(err))
       })
    })
  })

  test("Returns 200 the group - user call", (done) => {
    Group.create({
      name: "test1",
      members: [{email: "tester@test.com"},{email: "test2@email.com"}]
    }).then(() => {
        request(app)
        .get("/api/groups/test1")
        .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(200)
            expect(response.body.data).toStrictEqual({name: "test1", members: [{email: "tester@test.com"},{email: "test2@email.com"}]})
            done() 
        })
        .catch((err) => done(err))
       })
  })
})

describe("addToGroup", () => { 
  test("Returns 401 because the calling user is not an admin", (done) => {
    Group.create({
      name: "test",
      members: [{email: "test1@email.com"},{email: "test2@email.com"}]
    }).then(() => {
      User.insertMany([
        {username: "test1",
        email: "test1@email.com",
        password: "test1"},
        {username: "test2",
        email: "test2@email.com",
        password: "test2"},
        {username: "test3",
        email: "test3@email.com",
        password: "test3"},
        {username: "test4",
        email: "test4@email.com",
        password: "test4"},
        {username: "test5",
        email: "test5@email.com",
        password: "test5"},
        {username: "admin",
          email: "admin@email.com",
          password: "admin",
          refreshToken: adminAccessTokenValid,
          role: "Admin"}
      ]).then(() => {
        request(app)
        .patch("/api/groups/test/insert")
        .send({emails:["test3@email.com","test4@email.com"]})
        .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(401)
            expect(response.body.error).toBe("Not admin role")
            done()
        })
        .catch((err) => done(err))
       })
    })
  })

  test("Returns 400 because the calling user is not in the group", (done) => {
    Group.create({
      name: "test",
      members: [{email: "test1@email.com"},{email: "test2@email.com"}]
    }).then(() => {
      User.insertMany([
        {username: "test1",
        email: "test1@email.com",
        password: "test1"},
        {username: "test2",
        email: "test2@email.com",
        password: "test2"},
        {username: "test3",
        email: "test3@email.com",
        password: "test3"},
        {username: "test4",
        email: "test4@email.com",
        password: "test4"},
        {username: "test5",
        email: "test5@email.com",
        password: "test5"},
        {username: "admin",
          email: "testerAdd@email.com",
          password: "testerAdd",
          refreshToken: testerAccessTokenValid,
          role: "User"}
      ]).then(() => {
        request(app)
        .patch("/api/groups/test/add")
        .send({emails:["test3@email.com","test4@email.com"]})
        .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(401)
            expect(response.body.error).toBe("Email is not included in the group emails")
            done()
        })
        .catch((err) => done(err))
       })
    })
  })
  test("Returns 400 because the emails array is empty", (done) => {
      Group.create({
        name: "test",
        members: [{email: "test1@email.com"},{email: "test2@email.com"}]
      }).then(() => {
        User.insertMany([
          {username: "test1",
          email: "test1@email.com",
          password: "test1"},
          {username: "test2",
          email: "test2@email.com",
          password: "test2"},
          {username: "test3",
          email: "test3@email.com",
          password: "test3"},
          {username: "test4",
          email: "test4@email.com",
          password: "test4"},
          {username: "test5",
          email: "test5@email.com",
          password: "test5"},
          {username: "admin",
            email: "testerAdd@email.com",
            password: "testerAdd",
            refreshToken: testerAccessTokenValid,
            role: "User"}
        ]).then(() => {
          request(app)
          .patch("/api/groups/test/insert")
          .send({emails:[]})
          .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
          .then((response) => {
              expect(response.status).toBe(400)
              expect(response.body.error).toBe("Missing and/or empty body attributes")
              done()
          })
          .catch((err) => done(err))
         })
      })
  })
  test("Returns 400 because we don't pass the emails array", (done) => {
    Group.create({
      name: "test",
      members: [{email: "test1@email.com"},{email: "test2@email.com"}]
    }).then(() => {
      User.insertMany([
        {username: "test1",
        email: "test1@email.com",
        password: "test1"},
        {username: "test2",
        email: "test2@email.com",
        password: "test2"},
        {username: "test3",
        email: "test3@email.com",
        password: "test3"},
        {username: "test4",
        email: "test4@email.com",
        password: "test4"},
        {username: "test5",
        email: "test5@email.com",
        password: "test5"},
        {username: "admin",
          email: "testerAdd@email.com",
          password: "testerAdd",
          refreshToken: testerAccessTokenValid,
          role: "User"}
      ]).then(() => {
        request(app)
        .patch("/api/groups/test/insert")
        .send({test:[{emails:"test "}]})
        .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(400)
            expect(response.body.error).toBe("Missing and/or empty body attributes")
            done()
        })
        .catch((err) => done(err))
       })
    })
})
  test("Returns 400 because the group does not exist", (done) => {
    Group.create({
      name: "test",
      members: [{email: "testerAdd@email.com"},{email: "test2@email.com"}]
    }).then(() => {
      User.insertMany([
        {username: "test1",
        email: "test1@email.com",
        password: "test1"},
        {username: "test2",
        email: "test2@email.com",
        password: "test2"},
        {username: "test3",
        email: "test3@email.com",
        password: "test3"},
        {username: "test4",
        email: "test4@email.com",
        password: "test4"},
        {username: "test5",
        email: "test5@email.com",
        password: "test5"},
        {username: "admin",
          email: "testerAdd@email.com",
          password: "testerAdd",
          refreshToken: testerAccessTokenValid,
          role: "User"}
      ]).then(() => {
        request(app)
        .patch("/api/groups/test1/add")
        .send({emails:["test3@email.com","test4@email.com"]})
        .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(400)
            expect(response.body.error).toBe("Group not existing")
            done()
        })
        .catch((err) => done(err))
       })
    })
  })

  test("Returns 400 because one of the emails is an empty string", (done) => {
    Group.create({
      name: "test",
      members: [{email: "test1@email.com"},{email: "test2@email.com"}]
    }).then(() => {
      User.insertMany([
        {username: "test1",
        email: "test1@email.com",
        password: "test1"},
        {username: "test2",
        email: "test2@email.com",
        password: "test2"},
        {username: "test3",
        email: "test3@email.com",
        password: "test3"},
        {username: "test4",
        email: "test4@email.com",
        password: "test4"},
        {username: "test5",
        email: "test5@email.com",
        password: "test5"},
        {username: "admin",
          email: "testerAdd@email.com",
          password: "testerAdd",
          refreshToken: testerAccessTokenValid,
          role: "User"}
      ]).then(() => {
        request(app)
        .patch("/api/groups/test/insert")
        .send({emails:[""]})
        .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(400)
            expect(response.body.error).toBe("Emails cannot be empty")
            done()
        })
        .catch((err) => done(err))
       })
    })
})

test("Returns 400 because one of the emails is a wrong formatted string", (done) => {
  Group.create({
    name: "test",
    members: [{email: "test1@email.com"},{email: "test2@email.com"}]
  }).then(() => {
    User.insertMany([
      {username: "test1",
      email: "test1@email.com",
      password: "test1"},
      {username: "test2",
      email: "test2@email.com",
      password: "test2"},
      {username: "test3",
      email: "test3@email.com",
      password: "test3"},
      {username: "test4",
      email: "test4@email.com",
      password: "test4"},
      {username: "test5",
      email: "test5@email.com",
      password: "test5"},
      {username: "admin",
        email: "testerAdd@email.com",
        password: "testerAdd",
        refreshToken: testerAccessTokenValid,
        role: "User"}
    ]).then(() => {
      request(app)
      .patch("/api/groups/test/insert")
      .send({emails:["IAmAString"]})
      .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
      .then((response) => {
          expect(response.status).toBe(400)
          expect(response.body.error).toBe("Invalid email format inserted")
          done()
      })
      .catch((err) => done(err))
     })
  })
})

test("Returns 400 because the email is already in a group", (done) => {
  Group.create({
    name: "test",
    members: [{email: "test1@email.com"},{email: "test2@email.com"}]
  }).then(() => {
    User.insertMany([
      {username: "test1",
      email: "test1@email.com",
      password: "test1"},
      {username: "test2",
      email: "test2@email.com",
      password: "test2"},
      {username: "test3",
      email: "test3@email.com",
      password: "test3"},
      {username: "test4",
      email: "test4@email.com",
      password: "test4"},
      {username: "test5",
      email: "test5@email.com",
      password: "test5"},
      {username: "admin",
        email: "testerAdd@email.com",
        password: "testerAdd",
        refreshToken: testerAccessTokenValid,
        role: "User"}
    ]).then(() => {
      request(app)
      .patch("/api/groups/test/insert")
      .send({emails:["test1@email.com"]})
      .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
      .then((response) => {
          expect(response.status).toBe(400)
          expect(response.body.error).toBe("Insert valid emails")
          done()
      })
      .catch((err) => done(err))
     })
  })
})

test("Returns 400 because the email is not existing", (done) => {
  Group.create({
    name: "test",
    members: [{email: "test1@email.com"},{email: "test2@email.com"}]
  }).then(() => {
    User.insertMany([
      {username: "test1",
      email: "test1@email.com",
      password: "test1"},
      {username: "test2",
      email: "test2@email.com",
      password: "test2"},
      {username: "test3",
      email: "test3@email.com",
      password: "test3"},
      {username: "test4",
      email: "test4@email.com",
      password: "test4"},
      {username: "test5",
      email: "test5@email.com",
      password: "test5"},
      {username: "admin",
        email: "testerAdd@email.com",
        password: "testerAdd",
        refreshToken: testerAccessTokenValid,
        role: "User"}
    ]).then(() => {
      request(app)
      .patch("/api/groups/test/insert")
      .send({emails:["test8@email.com"]})
      .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
      .then((response) => {
          expect(response.status).toBe(400)
          expect(response.body.error).toBe("Insert valid emails")
          done()
      })
      .catch((err) => done(err))
     })
  })
})

test("Returns 200 Admin adds email to group", (done) => {
  Group.create({
    name: "test",
    members: [{email: "test1@email.com"},{email: "test2@email.com"}]
  }).then(() => {
    User.insertMany([
      {username: "test1",
      email: "test1@email.com",
      password: "test1"},
      {username: "test2",
      email: "test2@email.com",
      password: "test2"},
      {username: "test3",
      email: "test3@email.com",
      password: "test3"},
      {username: "test4",
      email: "test4@email.com",
      password: "test4"},
      {username: "test5",
      email: "test5@email.com",
      password: "test5"},
      {username: "admin",
        email: "admin@email.com",
        password: "admin",
        refreshToken: adminAccessTokenValid,
        role: "Admin"}
    ]).then(() => {
      request(app)
      .patch("/api/groups/test/insert")
      .send({emails:["test3@email.com"]})
      .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
      .then((response) => {
          expect(response.status).toBe(200)
          expect(response.body.data.group).toStrictEqual({name: "test", members:[{email:"test1@email.com"},{email:"test2@email.com"},{email:"test3@email.com"}]})
          expect(response.body.data.alreadyInGroup).toHaveLength(0)
          expect(response.body.data.membersNotFound).toHaveLength(0)
          done()
      })
      .catch((err) => done(err))
     })
  })
})

test("Returns 200 Admin adds emails to group and a non-existing email", (done) => {
  Group.create({
    name: "test",
    members: [{email: "test1@email.com"},{email: "test2@email.com"}]
  }).then(() => {
    User.insertMany([
      {username: "test1",
      email: "test1@email.com",
      password: "test1"},
      {username: "test2",
      email: "test2@email.com",
      password: "test2"},
      {username: "test3",
      email: "test3@email.com",
      password: "test3"},
      {username: "test4",
      email: "test4@email.com",
      password: "test4"},
      {username: "test5",
      email: "test5@email.com",
      password: "test5"},
      {username: "admin",
        email: "admin@email.com",
        password: "admin",
        refreshToken: adminAccessTokenValid,
        role: "Admin"}
    ]).then(() => {
      request(app)
      .patch("/api/groups/test/insert")
      .send({emails:["test3@email.com","test8@email.com"]})
      .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
      .then((response) => {
          expect(response.status).toBe(200)
          expect(response.body.data.group).toStrictEqual({name: "test", members:[{email:"test1@email.com"},{email:"test2@email.com"},{email:"test3@email.com"}]})
          expect(response.body.data.alreadyInGroup).toHaveLength(0)
          expect(response.body.data.membersNotFound).toHaveLength(1)
          done()
      })
      .catch((err) => done(err))
     })
  })
})

test("Returns 200 Admin adds emails to group and an email that is already in a group", (done) => {
  Group.create({
    name: "test",
    members: [{email: "test1@email.com"},{email: "test2@email.com"}]
  }).then(() => {
    User.insertMany([
      {username: "test1",
      email: "test1@email.com",
      password: "test1"},
      {username: "test2",
      email: "test2@email.com",
      password: "test2"},
      {username: "test3",
      email: "test3@email.com",
      password: "test3"},
      {username: "test4",
      email: "test4@email.com",
      password: "test4"},
      {username: "test5",
      email: "test5@email.com",
      password: "test5"},
      {username: "admin",
        email: "admin@email.com",
        password: "admin",
        refreshToken: adminAccessTokenValid,
        role: "Admin"}
    ]).then(() => {
      request(app)
      .patch("/api/groups/test/insert")
      .send({emails:["test3@email.com","test1@email.com"]})
      .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
      .then((response) => {
          expect(response.status).toBe(200)
          expect(response.body.data.group).toStrictEqual({name: "test", members:[{email:"test1@email.com"},{email:"test2@email.com"},{email:"test3@email.com"}]})
          expect(response.body.data.alreadyInGroup).toHaveLength(1)
          expect(response.body.data.membersNotFound).toHaveLength(0)
          done()
      })
      .catch((err) => done(err))
     })
  })
})

test("Returns 200 Admin adds emails to group, a non-existing email and an email that is already in a group", (done) => {
  Group.create({
    name: "test",
    members: [{email: "test1@email.com"},{email: "test2@email.com"}]
  }).then(() => {
    User.insertMany([
      {username: "test1",
      email: "test1@email.com",
      password: "test1"},
      {username: "test2",
      email: "test2@email.com",
      password: "test2"},
      {username: "test3",
      email: "test3@email.com",
      password: "test3"},
      {username: "test4",
      email: "test4@email.com",
      password: "test4"},
      {username: "test5",
      email: "test5@email.com",
      password: "test5"},
      {username: "admin",
        email: "admin@email.com",
        password: "admin",
        refreshToken: adminAccessTokenValid,
        role: "Admin"}
    ]).then(() => {
      request(app)
      .patch("/api/groups/test/insert")
      .send({emails:["test3@email.com","test1@email.com","test8@email.com"]})
      .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
      .then((response) => {
          expect(response.status).toBe(200)
          expect(response.body.data.group).toStrictEqual({name: "test", members:[{email:"test1@email.com"},{email:"test2@email.com"},{email:"test3@email.com"}]})
          expect(response.body.data.alreadyInGroup).toHaveLength(1)
          expect(response.body.data.membersNotFound).toHaveLength(1)
          done()
      })
      .catch((err) => done(err))
     })
  })
})

test("Returns 200 User adds emails to group, a non-existing email and an email that is already in a group", (done) => {
  Group.create({
    name: "test",
    members: [{email: "tester@test.com"},{email: "test2@email.com"}]
  }).then(() => {
    User.insertMany([
      {username: "test1",
      email: "test1@email.com",
      password: "test1"},
      {username: "test2",
      email: "test2@email.com",
      password: "test2"},
      {username: "test3",
      email: "test3@email.com",
      password: "test3"},
      {username: "test4",
      email: "test4@email.com",
      password: "test4"},
      {username: "test5",
      email: "test5@email.com",
      password: "test5"},
      {username: "tester",
        email: "tester@test.com",
        password: "admin",
        refreshToken: testerAccessTokenValid,
        role: "User"}
    ]).then(() => {
      request(app)
      .patch("/api/groups/test/add")
      .send({emails:["test3@email.com","test2@email.com","test8@email.com"]})
      .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
      .then((response) => {
          expect(response.status).toBe(200)
          expect(response.body.data.group).toStrictEqual({name: "test", members:[{email:"tester@test.com"},{email:"test2@email.com"},{email:"test3@email.com"}]})
          expect(response.body.data.alreadyInGroup).toHaveLength(1)
          expect(response.body.data.membersNotFound).toHaveLength(1)
          done()
      })
      .catch((err) => done(err))
     })
  })
})

test("Returns 200 User adds two emails to group, two non-existing emails and two emails that are already in a group", (done) => {
  Group.create({
    name: "test",
    members: [{email: "tester@test.com"},{email: "test2@email.com"},{email:"test3@email.com"}]
  }).then(() => {
    User.insertMany([
      {username: "test1",
      email: "test1@email.com",
      password: "test1"},
      {username: "test2",
      email: "test2@email.com",
      password: "test2"},
      {username: "test3",
      email: "test3@email.com",
      password: "test3"},
      {username: "test4",
      email: "test4@email.com",
      password: "test4"},
      {username: "test5",
      email: "test5@email.com",
      password: "test5"},
      {username: "tester",
        email: "tester@test.com",
        password: "admin",
        refreshToken: testerAccessTokenValid,
        role: "User"}
    ]).then(() => {
      request(app)
      .patch("/api/groups/test/add")
      .send({emails:["test3@email.com","test2@email.com","test8@email.com","test4@email.com","test5@email.com","test9@email.com"]})
      .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
      .then((response) => {
          expect(response.status).toBe(200)
          expect(response.body.data.group).toStrictEqual({name: "test", members:[{email:"tester@test.com"},{email:"test2@email.com"},{email:"test3@email.com"},{email:"test4@email.com"},{email:"test5@email.com"}]})
          expect(response.body.data.alreadyInGroup).toHaveLength(2)
          expect(response.body.data.membersNotFound).toHaveLength(2)
          done()
      })
      .catch((err) => done(err))
     })
  })
})
})

describe("removeFromGroup", () => {
  beforeEach(async () => {
    await Group.insertMany([
      {
          name:"testgroup",
          members:[
              {
                  email:"tester@test.com"
              },
              {
                  email:"felice@email.com"
              }
          ]
      },
      {
          name:"othertestgroup",
          members:[
              {
                  email:"othertester@test.com"
              },
              {
                  email:"admin@email.com"
              },
              {
                email:"otheradmin@email.com"
              }
          ]
      },
      {
        name:"singletestgroup",
        members:[
            {
                email:"test@test.com"
            }
        ]
    }
    ]);
    await User.insertMany([
      {
          username: "tester",
          email: "tester@test.com",
          password: "tester",
          refreshToken: testerAccessTokenValid
      }, {
          username: "felice",
          email: "felice@email.com",
          password: "felice",
          refreshToken: adminAccessTokenValid,
          role: "Admin"
      },
      {
        username: "othertester",
        email: "othertester@test.com",
        password: "tester",
        refreshToken: testerAccessTokenValid
      },
      {
        username: "admin",
        email: "admin@email.com",
        password: "admin",
        refreshToken: testerAccessTokenValid,
        role:"Admin"
      },
      {
        username: "otheradmin",
        email: "otheradmin@email.com",
        password: "admin",
        refreshToken: testerAccessTokenValid,
        role:"Admin"
      }
    ]);
    await categories.insertMany([
      {
        type: "food",
        color: "red"
      },{
        type: "papers",
        color: "white"
      }
    ]);
    await transactions.insertMany([
      {
          username:"tester",
          amount:100,
          type:"food",
          date:"2023-05-19T10:00:00Z"
      },
      {
          username:"felice",
          amount: -1,
          type:"papers",
          date:"2023-05-19T10:00:00Z"
      },
      {
          username:"othertester",
          amount:45,
          type:"MtG cards",
          date:"2023-05-19T10:00:00Z"
      }
    ]);
  })

  test("Returns 400 the group doesn't exist",(done) => {
    request(app)
        .patch("/api/groups/notexistinggroup/pull")
        .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(400)
            expect(response.body.error).toBe("Group not existing")
            done() 
        })
        .catch((err) => done(err))
  })

  test("Returns 401 anauthorized - admin route",(done) => {
    request(app)
        .patch("/api/groups/testgroup/pull")
        .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(401)
            expect(response.body.error).toBe("Not admin role")
            done() 
        })
        .catch((err) => done(err))
  })

  test("Returns 401 anauthorized - user route",(done) => {
    request(app)
        .patch("/api/groups/testgroup/remove")
        .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(401)
            expect(response.body.error).toBe("Email is not included in the group emails")
            done() 
        })
        .catch((err) => done(err))
  })

  test("Returns 400 missing body parameters",(done) => {
    request(app)
        .patch("/api/groups/testgroup/remove")
        .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(400)
            expect(response.body.error).toBe("Missing and/or empty body attributes")
            done() 
        })
        .catch((err) => done(err))
  })

  test("Returns 400 empty body parameters",(done) => {
    request(app)
        .patch("/api/groups/testgroup/pull")
        .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
        .send({emails:[]})
        .then((response) => {
            expect(response.status).toBe(400)
            expect(response.body.error).toBe("Missing and/or empty body attributes")
            done() 
        })
        .catch((err) => done(err))
  })

  test("Returns 400 single user group cannot be deleted",(done) => {
    request(app)
        .patch("/api/groups/singletestgroup/pull")
        .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
        .send({emails:["test@email.com"]})
        .then((response) => {
            expect(response.status).toBe(400)
            expect(response.body.error).toBe("Cannot remove members from a group with only one user")
            done() 
        })
        .catch((err) => done(err))
  })

  test("Returns 400 empty mail ",(done) => {
    request(app)
        .patch("/api/groups/testgroup/pull")
        .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
        .send({emails:["test@email.com", "", "felice@email.com"]})
        .then((response) => {
            expect(response.status).toBe(400)
            expect(response.body.error).toBe("Emails cannot be empty")
            done() 
        })
        .catch((err) => done(err))
  })

  test("Returns 400 invalid mail format",(done) => {
    request(app)
        .patch("/api/groups/testgroup/pull")
        .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
        .send({emails:["test@email.com", "invalidformat", "felice@email.com"]})
        .then((response) => {
            expect(response.status).toBe(400)
            expect(response.body.error).toBe("Invalid email format inserted")
            done() 
        })
        .catch((err) => done(err))
  })

  test("Returns 400 none of the emails are in this group",(done) => {
    request(app)
        .patch("/api/groups/testgroup/remove")
        .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
        .send({emails:["nottest@email.com", "admin@email.com"]})
        .then((response) => {
            expect(response.status).toBe(400)
            expect(response.body.error).toBe("None of the emails are in this group")
            done() 
        })
        .catch((err) => done(err))
  })

  test("Returns 200 succesfull deletion - one mail doesn't exist and one is in another group",(done) => {
    request(app)
        .patch("/api/groups/testgroup/remove")
        .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
        .send({emails:["tester@test.com","unexisting@email.com","admin@email.com"]})
        .then((response) => {
            expect(response.status).toBe(200)
            expect(response.body.data.group.name).toBe("testgroup")
            expect(response.body.data.group.members).toHaveLength(1)
            expect(response.body.data.group.members[0].email).toBe("felice@email.com")
            expect(response.body.data.membersNotFound).toHaveLength(1)
            expect(response.body.data.membersNotFound[0].email).toBe("unexisting@email.com")
            expect(response.body.data.notInGroup).toHaveLength(1)
            expect(response.body.data.notInGroup[0].email).toBe("admin@email.com")
            done() 
        })
        .catch((err) => done(err))
  })

  test("Returns 200 succesfull deletion - N to remove < N members in group",(done) => {
    request(app)
        .patch("/api/groups/testgroup/remove")
        .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
        .send({emails:["tester@test.com"]})
        .then((response) => {
            expect(response.status).toBe(200)
            expect(response.body.data.group.name).toBe("testgroup")
            expect(response.body.data.group.members).toHaveLength(1)
            expect(response.body.data.group.members[0].email).toBe("felice@email.com")
            done() 
        })
        .catch((err) => done(err))
  })

  test("Returns 200 succesfull deletion - N to remove == N members in group",(done) => {
    request(app)
        .patch("/api/groups/testgroup/remove")
        .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
        .send({emails:["tester@test.com","felice@email.com"]})
        .then((response) => {
            expect(response.status).toBe(200)
            expect(response.body.data.group.name).toBe("testgroup")
            expect(response.body.data.group.members).toHaveLength(1)
            expect(response.body.data.group.members[0].email).toBe("tester@test.com")
            done() 
        })
        .catch((err) => done(err))
  })

  test("Returns 200 succesfull deletion - multiple users deleted",(done) => {
    request(app)
        .patch("/api/groups/othertestgroup/remove")
        .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
        .send({emails:["othertester@test.com","admin@email.com"]})
        .then((response) => {
            expect(response.status).toBe(200)
            expect(response.body.data.group.name).toBe("othertestgroup")
            expect(response.body.data.group.members).toHaveLength(1)
            expect(response.body.data.group.members[0].email).toBe("otheradmin@email.com")
            done() 
        })
        .catch((err) => done(err))
  })

})

describe("deleteUser", () => {
  beforeEach(async () => {
    await Group.deleteMany({})
    await User.deleteMany({})
    await transactions.deleteMany({})


    await User.create({
      username: "tester1",
      email: "test1@test.com",
      password: "tester",
    })
    await User.create({
      username: "tester2",
      email: "test2@test.com",
      password: "tester",
    })

    User.create({
      username: "tester",
      email : "test@test.com",
      password: "tester",
      role : "Admin"

    })
    
  })
  test("Returns 401 user is not an Amdin", (done) => {
    const reqBody={
      emails:["test1@test.com"]
    }
    User.create({
      username: "tester3",
      email: "tester3@test.com",
      password: "tester",
    }).then(() => {
      request(app)
        .delete("/api/users")
        .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
        .send(reqBody)
        .then((response) => {
          expect(response.status).toBe(401)
          done() // Notify Jest that the test is complete
    })
    .catch((err) => done(err))
    })
  })

  test("Returns 400 because req attributes missing", (done) => {
    const reqBody={}
    User.create({
      username: "admin1",
      email: "admin1@test.com",
      password: "tester",
    }).then(() => {
      request(app)
        .delete("/api/users")
        .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
        .send(reqBody)
        .then((response) => {
          expect(response.status).toBe(400)
          done() // Notify Jest that the test is complete
    })
    .catch((err) => done(err))
    })
  })
  test("Returns 400 email empty string", (done) => {
    const reqBody={email: "  "}
    User.create({
      username: "admin1",
      email: "admin1@test.com",
      password: "tester",
    }).then(() => {
      request(app)
        .delete("/api/users")
        .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
        .send(reqBody)
        .then((response) => {
          expect(response.status).toBe(400)
          done() // Notify Jest that the test is complete
    })
    .catch((err) => done(err))
    })
  })
  test("Returns 400 incorrect email format", (done) => {

    const reqBody={email: "invalid.com"}

    User.create({
      username: "admin1",
      email: "admin1@test.com",
      password: "tester",
    }).then(() => {
      request(app)
        .delete("/api/users")
        .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
        .send(reqBody)
        .then((response) => {
          expect(response.status).toBe(400)
          done() // Notify Jest that the test is complete
    })
    .catch((err) => done(err))
    })
  })
  test("Returns 400 email does not exist in database", (done) => {
    const reqBody={email: "t@test.com"}
    User.create({
      username: "admin1",
      email: "admin1@test.com",
      password: "tester",
    }).then(() => {
      request(app)
        .delete("/api/users")
        .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
        .send(reqBody)
        .then((response) => {
          expect(response.status).toBe(400)
          done() // Notify Jest that the test is complete
    })
    .catch((err) => done(err))
    })
  })

  test("Returns 200 successfull case delete from group and deletetransaction",(done) =>{

    const reqBody={email: "test1@test.com"}
    Group.create({
      name: "group1",
      members:[{email:"test1@test.com"},{email:"test2@test.com"}]
    }).then(()=>{
      User.create({
        username: "admin1",
        email: "admin1@test.com",
        password: "password",
      }).then(() =>{
        transactions.create({
          username : "tester1",
          type: "food",
          amout: 1,
        })
      }).then(() => {
        request(app)
          .delete("/api/users")
          .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
          .send(reqBody)
          .then((response) => {
            expect(response.status).toBe(200)
            expect(response.body.data.deletedTransactions).toEqual(1);
            expect(response.body.data.deletedFromGroup).toEqual(true);
            done() // Notify Jest that the test is complete
      })
      .catch((err) => done(err))
      })
    })
  })
})



  describe("deleteGroup", () => { 
    test("Returns 401 because the calling user is not an admin", (done) => {
      Group.create({
        name: "test",
        members: [{email: "test1@email.com"},{email: "test2@email.com"}]
      }).then(() => {
          request(app)
          .delete("/api/groups")
          .send({name: "test"})
          .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
          .then((response) => {
              expect(response.status).toBe(401)
              expect(response.body.error).toBe("Not admin role")
              done() 
          })
          .catch((err) => done(err))
         })
    })
  
    test("Returns 400 because it misses the name parameter", (done) => {
      Group.create({
        name: "test",
        members: [{email: "test1@email.com"},{email: "test2@email.com"}]
      }).then(() => {
          request(app)
          .delete("/api/groups")
          .send({test: "test"})
          .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
          .then((response) => {
              expect(response.status).toBe(400)
              expect(response.body.error).toBe("Not all the necessary data was inserted")
              done() 
          })
          .catch((err) => done(err))
         })
    })
    
    test("Returns 400 because the name parameter is empty", (done) => {
      Group.create({
        name: "test",
        members: [{email: "test1@email.com"},{email: "test2@email.com"}]
      }).then(() => {
          request(app)
          .delete("/api/groups")
          .send({name: ""})
          .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
          .then((response) => {
              expect(response.status).toBe(400)
              expect(response.body.error).toBe("The group name is an empty string")
              done() 
          })
          .catch((err) => done(err))
         })
    })
  
    test("Returns 400 because the group does not exist", (done) => {
      Group.create({
        name: "test",
        members: [{email: "test1@email.com"},{email: "test2@email.com"}]
      }).then(() => {
          request(app)
          .delete("/api/groups")
          .send({name: "test1"})
          .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
          .then((response) => {
              expect(response.status).toBe(400)
              expect(response.body.error).toBe("The group does not exist")
              done() 
          })
          .catch((err) => done(err))
         })
    })
  
    test("Returns 200 The group is deleted", (done) => {
      Group.create({
        name: "test",
        members: [{email: "test1@email.com"},{email: "test2@email.com"}]
      }).then(() => {
          request(app)
          .delete("/api/groups")
          .send({name: "test"})
          .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
          .then((response) => {
              expect(response.status).toBe(200)
              expect(response.body.data.message).toBe("Group deleted succesfully")
              done() 
          })
          .catch((err) => done(err))
         })
    })
  })
