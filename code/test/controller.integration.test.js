import request from 'supertest';
import { app } from '../app';
import { categories} from '../models/model';
import {transactions } from '../models/model';
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';
import {User, Group} from "../models/User";
import jwt from 'jsonwebtoken';
import { verifyAuth, handleAmountFilterParams, handleDateFilterParams } from '../controllers/utils';

dotenv.config();

beforeAll(async () => {
  const dbName = "testingDatabaseController";
  const url = `${process.env.MONGO_URI}/${dbName}`;

  await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

//used to ensure that each test can insert the data it needs without duplicate issues
beforeEach(async() => {
    await categories.deleteMany({});
    await transactions.deleteMany({});
    await User.deleteMany({});
    await Group.deleteMany({});
});

/**
 * Necessary tokens for authentication
 */
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

describe("createCategory", () => { 
    
    test("Returns 401: because the calling user is not an admin", (done) => {
        categories.create({
            type: "food",
            color: "red"
        }).then(() => {
            User.create({
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }).then(() => {
                request(app)
                .post("/api/categories")
                .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
                .then((response) => {
                    expect(response.status).toBe(401)
                    expect(response.body.error).toBe("Not admin role")
                    done() // Notify Jest that the test is complete
                })
                .catch((err) => done(err))
            })
        })
    })
    
    test("Returns 400: because one or more params are missing", (done) => {
        categories.create({
            type: "food",
            color: "red"
        }).then(() => {
            User.create({
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }).then(() => {
                    request(app)
                    .post("/api/categories")
                    .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
                    .send({color:"red"})
                    .then((response) => {
                        expect(response.status).toBe(400)
                        expect(response.body.error).toBe("Request's body is incomplete; it should contain non-empty type and color")
                        done() // Notify Jest that the test is complete
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("Returns 400: because one or more params are empty strings", (done) => {
        categories.create({
            type: "food",
            color: "red"
        }).then(() => {
            User.create({
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }).then(() => {
                request(app)
                .post("/api/categories")
                .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
                .send({type:'food',color:""})
                .then((response) => {
                    expect(response.status).toBe(400)
                    expect(response.body.error).toBe("Request's body is incomplete; it should contain non-empty type and color")
                    done() // Notify Jest that the test is complete
                })
                .catch((err) => done(err))
            })
        })
    })

    test("Returns 400: because the type passed is one of an already existing category", (done) => {
        categories.create({
            type:"food",
            color:"green"
        }).then(() => {
            User.create({
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }).then(() => {
                request(app)
                .post("/api/categories")
                .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
                .send({type:'food', color:"red"})
                .then((response) => {
                    expect(response.status).toBe(400)
                    expect(response.body.error).toBe("A category of this type is already present")
                    done() // Notify Jest that the test is complete
                })
                .catch((err) => done(err))
            })
        })
    })

    test("Returns 200: the correctly inserted category", (done) => {
        categories.create({
            type:"food",
            color:"green"
        }).then(() => {
            User.create({
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }).then(() => {
                request(app)
                .post("/api/categories")
                .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
                .send({type:'health', color:"green"})
                .then((response) => {
                    expect(response.status).toBe(200)
                    expect(response.body.data).toStrictEqual({type:"health", color:"green"})
                    done() // Notify Jest that the test is complete
                })
                .catch((err) => done(err))
            })
        })
    })
    
})

describe("updateCategory", () => { 
    
    test("Returns 401: because the calling user is not an admin", (done) => {
        categories.create({
            type:"food",
            color:"green"
        }).then(() => {
            User.create({
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }).then(() => {
                request(app)
                .patch("/api/categories/food")
                .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
                .then((response) => {
                    expect(response.status).toBe(401)
                    expect(response.body.error).toBe("Not admin role")
                    done() // Notify Jest that the test is complete
                })
                .catch((err) => done(err))
            })
        })
    })
    
    test("Returns 400: because the request body does not contain all the requested attributes", (done) => {
        categories.create({
            type:"food",
            color:"green"
        }).then(() => {
            User.create({
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }).then(() => {
                request(app)
                .patch("/api/categories/food")
                .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
                .send({type:"food"})
                .then((response) => {
                    expect(response.status).toBe(400)
                    expect(response.body.error).toBe("Missing values in the parameters or body")
                    done() // Notify Jest that the test is complete
                })
                .catch((err) => done(err))
            })
        })
    })

    test("Returns 400: because one or more of the body's parameter are empty strings", (done) => {
        categories.create({
            type:"food",
            color:"green"
        }).then(() => {
            User.create({
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }).then(() => {
                request(app)
                .patch("/api/categories/food")
                .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
                .send({type:"", color:"yellow"})
                .then((response) => {
                    expect(response.status).toBe(400)
                    expect(response.body.error).toBe("Request's body is incomplete; it should contain non-empty type and color")
                    done() // Notify Jest that the test is complete
                })
                .catch((err) => done(err))
            })
        })
    })

    test("Returns 400: because the route category doesn't exist in the database", (done) => {
        categories.create({
            type:"food",
            color:"green"
        }).then(() => {
            User.create({
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }).then(() => {
                request(app)
                .patch("/api/categories/notfood")
                .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
                .send({type:"food", color:"yellow"})
                .then((response) => {
                    expect(response.status).toBe(400)
                    expect(response.body.error).toBe("The requested category doesn't exists")
                    done() // Notify Jest that the test is complete
                })
                .catch((err) => done(err))
            })
        })
    })

    test("Returns 400: because the new category type already exists as a different category in the db ", (done) => {
        categories.insertMany([{
                type:"food",
                color:"green"
            },{
                type:"health",
                color:"green"
            }
        ]).then(() => {
            User.create({
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }).then(() => {
                request(app)
                .patch("/api/categories/food")
                .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
                .send({type:"health", color:"yellow"})
                .then((response) => {
                    expect(response.status).toBe(400)
                    expect(response.body.error).toBe("The new category type is already present and belongs to another category")
                    done() // Notify Jest that the test is complete
                })
                .catch((err) => done(err))
            })
        })
    })

    test("Returns  200: correctly updated category - only color changes (no transaction changed) ", (done) => {
        transactions.insertMany([
            {
                username:"tester",
                amount:100,
                type:"food",
                date:"2023-05-19T10:00:00Z"
            },
            {
                username:"mattia",
                amount:45,
                type:"MtG cards",
                date:"2023-05-19T10:00:00Z"
            }
        ]).then(() => {
            categories.insertMany([{
                type:"food",
                color:"green"
            },{
                type:"health",
                color:"green"
            }
            ]).then(() => {
                User.create({
                    username: "admin",
                    email: "admin@email.com",
                    password: "admin",
                    refreshToken: adminAccessTokenValid,
                    role: "Admin"
                }).then(() => {
                    request(app)
                    .patch("/api/categories/food")
                    .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
                    .send({type:"food", color:"yellow"})
                    .then((response) => {
                        expect(response.status).toBe(200)
                        expect(response.body.data.message).toBe("Category updated successfully")
                        expect(response.body.data.count).toBe(0)
                        done() // Notify Jest that the test is complete
                    })
                    .catch((err) => done(err))
                })
            })
        })
    })

    test("Returns 200: correctly updated category - both changes (transaction changed) ", (done) => {
        transactions.insertMany([
            {
                username:"tester",
                amount:100,
                type:"food",
                date:"2023-05-19T10:00:00Z"
            },
            {
                username:"mattia",
                amount:45,
                type:"MtG cards",
                date:"2023-05-19T10:00:00Z"
            }
        ]).then(() => {
            categories.insertMany([{
                type:"food",
                color:"green"
            },{
                type:"health",
                color:"green"
            }
            ]).then(() => {
                User.create({
                    username: "admin",
                    email: "admin@email.com",
                    password: "admin",
                    refreshToken: adminAccessTokenValid,
                    role: "Admin"
                }).then(() => {
                    request(app)
                    .patch("/api/categories/food")
                    .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
                    .send({type:"cards", color:"yellow"})
                    .then((response) => {
                        expect(response.status).toBe(200)
                        expect(response.body.data.message).toBe("Category updated successfully")
                        expect(response.body.data.count).toBe(1)
                        done() // Notify Jest that the test is complete
                    })
                    .catch((err) => done(err))
                })
            })
        })
    })
})


describe("deleteCategory", () => { 
    test("Returns 401: because the calling user is not an admin", (done) => {
        categories.create({
            type: "food",
            color: "red"
        }).then(() => {
            User.create({
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }).then(() => {
                request(app)
                .delete("/api/categories")
                .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
                .then((response) => {
                    expect(response.status).toBe(401)
                    expect(response.body.error).toBe("Not admin role")
                    done() // Notify Jest that the test is complete
                })
                .catch((err) => done(err))
            })
        })
    })

    test("Returns 400: because the request body does not contain the required attributes - missing", (done) => {
        categories.create({
            type: "food",
            color: "red"
        }).then(() => {
            User.create({
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }).then(() => {
                request(app)
                .delete("/api/categories")
                .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
                .then((response) => {
                    expect(response.status).toBe(400)
                    expect(response.body.error).toBe("Request's body is incomplete. It should contain a non-empty array of types")
                    done() // Notify Jest that the test is complete
                })
                .catch((err) => done(err))
            })
        })
    })

    test("Returns 400: because the request body does not contain the required attributes - empty", (done) => {
        categories.create({
            type: "food",
            color: "red"
        }).then(() => {
            User.create({
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }).then(() => {
                request(app)
                .delete("/api/categories")
                .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
                .send({types:[]})
                .then((response) => {
                    expect(response.status).toBe(400)
                    expect(response.body.error).toBe("Request's body is incomplete. It should contain a non-empty array of types")
                    done() // Notify Jest that the test is complete
                })
                .catch((err) => done(err))
            })
        })
    })

    test("Returns 400: because there's only one category and it cannot be deleted", (done) => {
        categories.create({
            type: "food",
            color: "red"
        }).then(() => {
            User.create({
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }).then(() => {
                request(app)
                .delete("/api/categories")
                .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
                .send({types:["food", "health"]})
                .then((response) => {
                    expect(response.status).toBe(400)
                    expect(response.body.error).toBe("There is only one category in the database and it cannot be deleted")
                    done() // Notify Jest that the test is complete
                })
                .catch((err) => done(err))
            })
        })
    })

    test("Returns 400: because the request body contains one or more empty strings", (done) => {
        categories.insertMany([
            {
                type: "food",
                color: "red"
            },
            {
                type: "health",
                color: "green"
            }
        ]).then(() => {
            User.create({
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }).then(() => {
                request(app)
                .delete("/api/categories")
                .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
                .send({types:["food", "", "health"]})
                .then((response) => {
                    expect(response.status).toBe(400)
                    expect(response.body.error).toBe("Types in the array should not be empty")
                    done() // Notify Jest that the test is complete
                })
                .catch((err) => done(err))
            })
        })
    })

    test("Returns 400: because the request body contains one or more non existing category", (done) => {
        categories.insertMany([
            {
                type: "food",
                color: "red"
            },
            {
                type: "health",
                color: "green"
            }
        ]).then(() => {
            User.create({
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }).then(() => {
                request(app)
                .delete("/api/categories")
                .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
                .send({types:["food", "notHealthy"]})
                .then((response) => {
                    expect(response.status).toBe(400)
                    expect(response.body.error).toBe("The category of type 'notHealthy' doesn't exist")
                    done() // Notify Jest that the test is complete
                })
                .catch((err) => done(err))
            })
        })
    })
    
    test("Returns 200: correctly deleted message - T (# categories to delete) = N (# databases categories)", (done) => {
        transactions.insertMany([
            {
                username:"tester",
                amount:100,
                type:"food",
                date:"2023-05-19T10:00:00Z"
            },
            {
                username:"mattia",
                amount:45,
                type:"health",
                date:"2023-05-19T10:00:00Z"
            }
        ]).then(() => {
            categories.insertMany([
                {
                    type: "food",
                    color: "red"
                },
                {
                    type: "health",
                    color: "green"
                }
            ]).then(() => {
                User.create({
                    username: "admin",
                    email: "admin@email.com",
                    password: "admin",
                    refreshToken: adminAccessTokenValid,
                    role: "Admin"
                }).then(() => {
                    request(app)
                    .delete("/api/categories")
                    .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
                    .send({types:["food", "health"]})
                    .then((response) => {
                        expect(response.status).toBe(200)
                        expect(response.body.data.message).toBe("Categories deleted")
                        expect(response.body.data.count).toBe(1)
                        done() // Notify Jest that the test is complete
                    })
                    .catch((err) => done(err))
                })
            })
        })
    })

    test("Returns 200: correctly deleted message - T (# categories to delete)> N (# databases categories)", (done) => {
        transactions.insertMany([
            {
                username:"tester",
                amount:100,
                type:"food",
                date:"2023-05-19T10:00:00Z"
            },
            {
                username:"mattia",
                amount:45,
                type:"health",
                date:"2023-05-19T10:00:00Z"
            }
        ]).then(() => {
            categories.insertMany([
                {
                    type: "food",
                    color: "red"
                },
                {
                    type: "health",
                    color: "green"
                }
            ]).then(() => {
                User.create({
                    username: "admin",
                    email: "admin@email.com",
                    password: "admin",
                    refreshToken: adminAccessTokenValid,
                    role: "Admin"
                }).then(() => {
                    request(app)
                    .delete("/api/categories")
                    .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
                    .send({types:["food"]})
                    .then((response) => {
                        expect(response.status).toBe(200)
                        expect(response.body.data.message).toBe("Categories deleted")
                        expect(response.body.data.count).toBe(1)
                        done() // Notify Jest that the test is complete
                    })
                    .catch((err) => done(err))
                })
            })
        })
    })
})

describe("getCategories", () => { 
    test("Returns 401: because the calling user is not authenticated", (done) => {
        categories.create({
            type: "food",
            color: "red"
        }).then(() => {
            User.create({
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }).then(() => {
                request(app)
                .get("/api/categories")
                .set("Cookie", `none`)
                .then((response) => {
                    expect(response.status).toBe(401)
                    expect(response.body.error).toBe("Unauthorized")
                    done() // Notify Jest that the test is complete
                })
                .catch((err) => done(err))
            })
        })
    })

    test("Returns 200: both the transactions present", (done) => {
        categories.insertMany([{
            type:"food",
            color:"green"
        },{
            type:"health",
            color:"green"
        }
        ]).then(() => {
            User.create({
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }).then(() => {
                request(app)
                .get("/api/categories")
                .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
                .send({type:"cards", color:"yellow"})
                .then((response) => {
                    expect(response.status).toBe(200)
                    expect(response.body.data).toHaveLength(2)
                    expect(response.body.data[0].type).toBe("food")
                    expect(response.body.data[1].type).toBe("health")
                    done() // Notify Jest that the test is complete
                })
                .catch((err) => done(err))
            })
        })
    })

    test("Returns 200: [] because there are no transactions present", (done) => {
        User.create({
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminAccessTokenValid,
            role: "Admin"
        }).then(() => {
            request(app)
            .get("/api/categories")
            .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
            .send({type:"cards", color:"yellow"})
            .then((response) => {
                expect(response.status).toBe(200)
                expect(response.body.data).toHaveLength(0)
                done() // Notify Jest that the test is complete
            })
            .catch((err) => done(err))
        })
    })
})

describe("createTransaction", () => { 
    test("Returns 401: because the calling user is not the one in the route", (done) => {
        //We create a category in our empty database (we know it's empty thanks to the beforeEach above)
        categories.create({
            type: "food",
            color: "red"
        }).then(() => {
            //We insert two users in the datbase: an Admin and a user 
            User.insertMany([{
                username: "tester",
                email: "tester@test.com",
                password: "tester",
                refreshToken: testerAccessTokenValid
            }, {
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }]).then(() => {
                request(app)
                .post("/api/users/tester/transactions")
                .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
                .send({username:"Mario", amount:"100", type:"food"})
                .then((response) => {
                    expect(response.status).toBe(401)
                    expect(response.body.error).toBe("The user can only access information about his account!")
                    done() // Notify Jest that the test is complete
                })
                .catch((err) => done(err))
            })})
    })

    test("Returns 400: because one or more of the body parameters are missing", (done) => {
        //We create a category in our empty database (we know it's empty thanks to the beforeEach above)
        categories.create({
            type: "food",
            color: "red"
        }).then(() => {
            //We insert two users in the datbase: an Admin and a user 
            User.insertMany([{
                username: "tester",
                email: "tester@test.com",
                password: "tester",
                refreshToken: testerAccessTokenValid
            }, {
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }]).then(() => {
                request(app)
                .post("/api/users/tester/transactions")
                .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
                .send({username:"", amount:"100"})
                .then((response) => {
                    expect(response.status).toBe(400)
                    expect(response.body.error).toBe("One or more parameters are missing or empty")
                    done() // Notify Jest that the test is complete
                })
                .catch((err) => done(err))
            })})
    })

    test("Returns 400: because the required category is not present in the database", (done) => {
        //We create a category in our empty database (we know it's empty thanks to the beforeEach above)
        categories.create({
            type: "food",
            color: "red"
        }).then(() => {
            //We insert two users in the datbase: an Admin and a user 
            User.insertMany([{
                username: "tester",
                email: "tester@test.com",
                password: "tester",
                refreshToken: testerAccessTokenValid
            }, {
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }]).then(() => {
                request(app)
                .post("/api/users/tester/transactions")
                .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
                .send({username:"tester", amount:"100", type:"foodn't"})
                .then((response) => {
                    expect(response.status).toBe(400)
                    expect(response.body.error).toBe("No such Category")
                    done() // Notify Jest that the test is complete
                })
                .catch((err) => done(err))
            })})
    })

    test("Returns 400: because the body user is not the one in the route", (done) => {
        //We create a category in our empty database (we know it's empty thanks to the beforeEach above)
        categories.create({
            type: "food",
            color: "red"
        }).then(() => {
            //We insert two users in the datbase: an Admin and a user 
            User.insertMany([{
                username: "tester",
                email: "tester@test.com",
                password: "tester",
                refreshToken: testerAccessTokenValid
            }, {
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }]).then(() => {
                request(app)
                .post("/api/users/tester/transactions")
                .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
                .send({username:"Mario", amount:"100", type:"food"})
                .then((response) => {
                    expect(response.status).toBe(400)
                    expect(response.body.error).toBe("User param and body mismatch")
                    done() // Notify Jest that the test is complete
                })
                .catch((err) => done(err))
            })})
    })

    test("Returns 400: because the body/param user is not present in the db", (done) => {
        //We create a category in our empty database (we know it's empty thanks to the beforeEach above)
        categories.create({
            type: "food",
            color: "red"
        }).then(() => {
            //We insert two users in the datbase: an Admin and a user 
            User.insertMany([{
                username: "nottester",
                email: "nottester@test.com",
                password: "tester",
                refreshToken: testerAccessTokenValid
            }, {
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }]).then(() => {
                request(app)
                .post("/api/users/tester/transactions")
                .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
                .send({username:"tester", amount:"100", type:"food"})
                .then((response) => {
                    expect(response.status).toBe(400)
                    expect(response.body.error).toBe("No such User")
                    done() // Notify Jest that the test is complete
                })
                .catch((err) => done(err))
            })})
    })

    test("Returns 400: because teh amount passed is not parseable to float", (done) => {
        //We create a category in our empty database (we know it's empty thanks to the beforeEach above)
        categories.create({
            type: "food",
            color: "red"
        }).then(() => {
            //We insert two users in the datbase: an Admin and a user 
            User.insertMany([{
                username: "tester",
                email: "tester@test.com",
                password: "tester",
                refreshToken: testerAccessTokenValid
            }, {
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }]).then(() => {
                request(app)
                .post("/api/users/tester/transactions")
                .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
                .send({username:"tester", amount:"notparse", type:"food"})
                .then((response) => {
                    expect(response.status).toBe(400)
                    expect(response.body.error).toBe("Not parseable amount")
                    done() // Notify Jest that the test is complete
                })
                .catch((err) => done(err))
            })})
    })

    test("Returns 200: the correct transaction", (done) => {
        //We create a category in our empty database (we know it's empty thanks to the beforeEach above)
        categories.create({
            type: "food",
            color: "red"
        }).then(() => {
            //We insert two users in the datbase: an Admin and a user 
            User.insertMany([{
                username: "tester",
                email: "tester@test.com",
                password: "tester",
                refreshToken: testerAccessTokenValid
            }, {
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }]).then(() => {
                request(app)
                .post("/api/users/tester/transactions")
                .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
                .send({username:"tester", amount:"1.2", type:"food"})
                .then((response) => {
                    expect(response.status).toBe(200)
                    expect(response.body.data.username).toBe("tester") 
                    expect(response.body.data.amount).toBe(1.2)
                    expect(response.body.data.type).toBe("food")
                    done() // Notify Jest that the test is complete
                })
                .catch((err) => done(err))
            })})
    })
})

describe("getAllTransactions", () => { 
    test("Returns 401: because the calling user is not an admin", (done) => {
        request(app)
        .get("/api/transactions")
        .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(401)
            expect(response.body.error).toBe("Not admin role")
            done() // Notify Jest that the test is complete
        })
        .catch((err) => done(err))
    })

    test("Returns 200: all the transactions present", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        },{
            type: "MtG cards",
            color: "multicolor"
        }]).then(() => {
            transactions.insertMany([
                {
                    username:"tester",
                    amount:100,
                    type:"food",
                    date:"2023-05-19T10:00:00Z"
                },
                {
                    username:"mattia",
                    amount:45,
                    type:"MtG cards",
                    date:"2023-05-19T10:00:00Z"
                }
            ]).then(()=>{
                request(app)
                .get("/api/transactions")
                .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
                .then((response) => {
                    expect(response.status).toBe(200)
                    //using toStrictEqual because we return a Date, not a string. Using .toBe({... date:new Date(2023-05-19T10:00:00.000Z)}) works too
                    expect(response.body.data[0]).toStrictEqual({ username:"tester", amount:100, type:"food", date:"2023-05-19T10:00:00.000Z", color:"red"})
                    expect(response.body.data[1]).toStrictEqual({ username:"mattia", amount:45, type:"MtG cards", date:"2023-05-19T10:00:00.000Z", color:"multicolor"})
                    done() // Notify Jest that the test is complete
                })
                .catch((err) => done(err))
            })
        })
        
    })

    test("Returns 200: empty list because there are no transactions present", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        },{
            type: "MtG cards",
            color: "multicolor"
        }]).then(() => {
            request(app)
            .get("/api/transactions")
            .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
            .then((response) => {
                expect(response.status).toBe(200)
                //using toStrictEqual because we return a Date, not a string. Using .toBe({... date:new Date(2023-05-19T10:00:00.000Z)}) works too
                expect(response.body.data).toHaveLength(0)
                done() // Notify Jest that the test is complete
            })
            .catch((err) => done(err))
        })
        
    })
})

describe("getTransactionsByUser", () => { 
    test("Returns 401: because the calling user is not an admin on admin route", (done) => {
        request(app)
        .get("/api/transactions/users/tester")
        .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(401)
            expect(response.body.error).toBe("Not admin role")
            done() // Notify Jest that the test is complete
        })
        .catch((err) => done(err))
    })
    
    test("Returns 401: because the calling user is not the route one", (done) => {
        request(app)
        .get("/api/users/nottester/transactions")
        .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(401)
            expect(response.body.error).toBe("The user can only access information about his account!")
            done() // Notify Jest that the test is complete
        })
        .catch((err) => done(err))
    })

    test("Returns 400: the required user is not present - user access", (done) => {
        request(app)
        .get("/api/users/tester/transactions")
        .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(400)
            expect(response.body.error).toBe("No such User")
            done() // Notify Jest that the test is complete
        })
        .catch((err) => done(err))
    })

    test("Returns 400: the required user is not present - admin access", (done) => {
        request(app)
        .get("/api/transactions/users/tester")
        .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(400)
            expect(response.body.error).toBe("No such User")
            done() // Notify Jest that the test is complete
        })
        .catch((err) => done(err))
    })

    test("Returns 200: all the transaction of the user 'tester' - admin access", (done) => {
        User.insertMany([
            {
                username: "tester",
                email: "tester@test.com",
                password: "tester",
                refreshToken: testerAccessTokenValid
            }, {
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }
        ]).then(
            categories.insertMany([{
                type: "food",
                color: "red"
            },{
                type: "MtG cards",
                color: "multicolor"
            }]).then(
                transactions.insertMany([
                    {
                        username:"tester",
                        amount:100,
                        type:"food",
                        date:"2023-05-19T10:00:00Z"
                    },
                    {
                        username:"admin",
                        amount: -1,
                        type:"papers",
                        date:"2023-05-19T10:00:00Z"
                    },
                    {
                        username:"tester",
                        amount:45,
                        type:"MtG cards",
                        date:"2023-05-19T10:00:00Z"
                    }
                ]).then(
                    request(app)
                    .get("/api/transactions/users/tester")
                    .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
                    .then((response) => {
                        expect(response.status).toBe(200)
                        expect(response.body.data).toHaveLength(2)
                        expect(response.body.data[0]).toStrictEqual({ username:"tester", amount:100, type:"food", date:"2023-05-19T10:00:00.000Z", color:"red"})
                        expect(response.body.data[1]).toStrictEqual({ username:"tester", amount:45, type:"MtG cards", date:"2023-05-19T10:00:00.000Z", color:"multicolor"}) 
                        done() // Notify Jest that the test is complete
                    })
                    .catch((err) => done(err))
                )
            )
        )
    })

    test("Returns 200: [] because the user 'tester' has no transactions - admin access", (done) => {
        User.insertMany([
            {
                username: "tester",
                email: "tester@test.com",
                password: "tester",
                refreshToken: testerAccessTokenValid
            }, {
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }
        ]).then(
            categories.insertMany([{
                type: "food",
                color: "red"
            },{
                type: "MtG cards",
                color: "multicolor"
            }]).then(
                transactions.insertMany([
                    {
                        username:"nottester",
                        amount:100,
                        type:"food",
                        date:"2023-05-19T10:00:00Z"
                    },
                    {
                        username:"admin",
                        amount: -1,
                        type:"papers",
                        date:"2023-05-19T10:00:00Z"
                    },
                    {
                        username:"nottester",
                        amount:45,
                        type:"MtG cards",
                        date:"2023-05-19T10:00:00Z"
                    }
                ]).then(
                    request(app)
                    .get("/api/transactions/users/tester")
                    .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
                    .then((response) => {
                        expect(response.status).toBe(200)
                        expect(response.body.data).toHaveLength(0)
                        done() // Notify Jest that the test is complete
                    })
                    .catch((err) => done(err))
                )
            )
        )
    })

    test("Returns 200: all the transaction of the user 'tester' - user access", (done) => {
        User.insertMany([
            {
                username: "tester",
                email: "tester@test.com",
                password: "tester",
                refreshToken: testerAccessTokenValid
            }, {
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }
        ]).then(
            categories.insertMany([{
                type: "food",
                color: "red"
            },{
                type: "MtG cards",
                color: "multicolor"
            }]).then(
                transactions.insertMany([
                    {
                        username:"tester",
                        amount:100,
                        type:"food",
                        date:"2023-05-19T10:00:00Z"
                    },
                    {
                        username:"admin",
                        amount: -1,
                        type:"papers",
                        date:"2023-05-19T10:00:00Z"
                    },
                    {
                        username:"tester",
                        amount:45,
                        type:"MtG cards",
                        date:"2023-05-19T10:00:00Z"
                    }
                ]).then(
                    request(app)
                    .get("/api/users/tester/transactions/")
                    .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
                    .then((response) => {
                        expect(response.status).toBe(200)
                        expect(response.body.data).toHaveLength(2)
                        expect(response.body.data[0]).toStrictEqual({ username:"tester", amount:100, type:"food", date:"2023-05-19T10:00:00.000Z", color:"red"})
                        expect(response.body.data[1]).toStrictEqual({ username:"tester", amount:45, type:"MtG cards", date:"2023-05-19T10:00:00.000Z", color:"multicolor"}) 
                        done() // Notify Jest that the test is complete
                    })
                    .catch((err) => done(err))
                )
            )
        )
    })

    test("Returns 200: all the transaction of the user 'tester' with amount => 50 - user access", (done) => {
        User.insertMany([
            {
                username: "tester",
                email: "tester@test.com",
                password: "tester",
                refreshToken: testerAccessTokenValid
            }, {
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }
        ]).then(
            categories.insertMany([{
                type: "food",
                color: "red"
            },{
                type: "MtG cards",
                color: "multicolor"
            }]).then(
                transactions.insertMany([
                    {
                        username:"tester",
                        amount:100,
                        type:"food",
                        date:"2023-05-19T10:00:00Z"
                    },
                    {
                        username:"admin",
                        amount: -1,
                        type:"papers",
                        date:"2023-05-19T10:00:00Z"
                    },
                    {
                        username:"tester",
                        amount:45,
                        type:"MtG cards",
                        date:"2023-05-19T10:00:00Z"
                    }
                ]).then(
                    request(app)
                    .get("/api/users/tester/transactions?min=50")
                    .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
                    .then((response) => {
                        expect(response.status).toBe(200)
                        expect(response.body.data).toHaveLength(1)
                        expect(response.body.data[0]).toStrictEqual({ username:"tester", amount:100, type:"food", date:"2023-05-19T10:00:00.000Z", color:"red"})
                        done() // Notify Jest that the test is complete
                    })
                    .catch((err) => done(err))
                )
            )
        )
    })

    test("Returns 200: all the transaction of the user 'tester' with amount <= 50 - user access", (done) => {
        User.insertMany([
            {
                username: "tester",
                email: "tester@test.com",
                password: "tester",
                refreshToken: testerAccessTokenValid
            }, {
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }
        ]).then(
            categories.insertMany([{
                type: "food",
                color: "red"
            },{
                type: "MtG cards",
                color: "multicolor"
            }]).then(
                transactions.insertMany([
                    {
                        username:"tester",
                        amount:100,
                        type:"food",
                        date:"2023-05-19T10:00:00Z"
                    },
                    {
                        username:"admin",
                        amount: -1,
                        type:"papers",
                        date:"2023-05-19T10:00:00Z"
                    },
                    {
                        username:"tester",
                        amount:45,
                        type:"MtG cards",
                        date:"2023-05-19T10:00:00Z"
                    }
                ]).then(
                    request(app)
                    .get("/api/users/tester/transactions?max=50")
                    .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
                    .then((response) => {
                        expect(response.status).toBe(200)
                        expect(response.body.data).toHaveLength(1)
                        expect(response.body.data[0]).toStrictEqual({ username:"tester", amount:45, type:"MtG cards", date:"2023-05-19T10:00:00.000Z", color:"multicolor"}) 
                        done() // Notify Jest that the test is complete
                    })
                    .catch((err) => done(err))
                )
            )
        )
    })

    test("Returns 200: all the transaction of the user 'tester' with 40 <= amount <= 100 - user access", (done) => {
        User.insertMany([
            {
                username: "tester",
                email: "tester@test.com",
                password: "tester",
                refreshToken: testerAccessTokenValid
            }, {
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }
        ]).then(
            categories.insertMany([{
                type: "food",
                color: "red"
            },{
                type: "MtG cards",
                color: "multicolor"
            }]).then(
                transactions.insertMany([
                    {
                        username:"tester",
                        amount:100,
                        type:"food",
                        date:"2023-05-19T10:00:00Z"
                    },
                    {
                        username:"tester",
                        amount: -1,
                        type:"papers",
                        date:"2023-05-19T10:00:00Z"
                    },
                    {
                        username:"tester",
                        amount:45,
                        type:"MtG cards",
                        date:"2023-05-19T10:00:00Z"
                    }
                ]).then(
                    request(app)
                    .get("/api/users/tester/transactions?min=40&max=100")
                    .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
                    .then((response) => {
                        expect(response.status).toBe(200)
                        expect(response.body.data).toHaveLength(2)
                        expect(response.body.data[0]).toStrictEqual({ username:"tester", amount:100, type:"food", date:"2023-05-19T10:00:00.000Z", color:"red"})
                        expect(response.body.data[1]).toStrictEqual({ username:"tester", amount:45, type:"MtG cards", date:"2023-05-19T10:00:00.000Z", color:"multicolor"}) 
                        done() // Notify Jest that the test is complete
                    })
                    .catch((err) => done(err))
                )
            )
        )
    })

    test("Returns 400: gets an error when passing a non-number min or max", (done) => {
        User.insertMany([
            {
                username: "tester",
                email: "tester@test.com",
                password: "tester",
                refreshToken: testerAccessTokenValid
            }, {
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }
        ]).then(
            categories.insertMany([{
                type: "food",
                color: "red"
            },{
                type: "MtG cards",
                color: "multicolor"
            }]).then(
                transactions.insertMany([
                    {
                        username:"tester",
                        amount:100,
                        type:"food",
                        date:"2023-05-19T10:00:00Z"
                    },
                    {
                        username:"admin",
                        amount: -1,
                        type:"papers",
                        date:"2023-04-19T10:00:00Z"
                    },
                    {
                        username:"tester",
                        amount:45,
                        type:"MtG cards",
                        date:"2023-04-19T10:00:00Z"
                    }
                ]).then(
                    request(app)
                    .get("/api/users/tester/transactions?min=doilooklikeanumber")
                    .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
                    .then((response) => {
                        expect(response.status).toBe(400)
                        expect(response.body.error).toBe("min, max or both are not a  number") 
                        done() // Notify Jest that the test is complete
                    })
                    .catch((err) => done(err))
                )
            )
        )
    })

    test("Returns 200: all the transaction of the user 'tester' with date >= 2023-05-20  - user access", (done) => {
        User.insertMany([
            {
                username: "tester",
                email: "tester@test.com",
                password: "tester",
                refreshToken: testerAccessTokenValid
            }, {
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }
        ]).then(
            categories.insertMany([{
                type: "food",
                color: "red"
            },{
                type: "MtG cards",
                color: "multicolor"
            }]).then(
                transactions.insertMany([
                    {
                        username:"tester",
                        amount:100,
                        type:"food",
                        date:"2024-05-19T10:00:00Z"
                    },
                    {
                        username:"admin",
                        amount: -1,
                        type:"papers",
                        date:"2023-05-19T10:00:00Z"
                    },
                    {
                        username:"tester",
                        amount:45,
                        type:"MtG cards",
                        date:"2023-05-19T10:00:00Z"
                    }
                ]).then(
                    request(app)
                    .get("/api/users/tester/transactions?from=2023-05-20")
                    .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
                    .then((response) => {
                        expect(response.status).toBe(200)
                        expect(response.body.data).toHaveLength(1)
                        expect(response.body.data[0]).toStrictEqual({ username:"tester", amount:100, type:"food", date:"2024-05-19T10:00:00.000Z", color:"red"})
                        done() // Notify Jest that the test is complete
                    })
                    .catch((err) => done(err))
                )
            )
        )
    })

    test("Returns 200: all the transaction of the user 'tester' with date <= 2023-04-19 - user access", (done) => {
        User.insertMany([
            {
                username: "tester",
                email: "tester@test.com",
                password: "tester",
                refreshToken: testerAccessTokenValid
            }, {
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }
        ]).then(
            categories.insertMany([{
                type: "food",
                color: "red"
            },{
                type: "MtG cards",
                color: "multicolor"
            }]).then(
                transactions.insertMany([
                    {
                        username:"tester",
                        amount:100,
                        type:"food",
                        date:"2023-05-19T10:00:00Z"
                    },
                    {
                        username:"admin",
                        amount: -1,
                        type:"papers",
                        date:"2023-05-19T10:00:00Z"
                    },
                    {
                        username:"tester",
                        amount:45,
                        type:"MtG cards",
                        date:"2023-04-19T10:00:00Z"
                    }
                ]).then(
                    request(app)
                    .get("/api/users/tester/transactions?upTo=2023-04-19")
                    .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
                    .then((response) => {
                        expect(response.status).toBe(200)
                        expect(response.body.data).toHaveLength(1)
                        expect(response.body.data[0]).toStrictEqual({ username:"tester", amount:45, type:"MtG cards", date:"2023-04-19T10:00:00.000Z", color:"multicolor"}) 
                        done() // Notify Jest that the test is complete
                    })
                    .catch((err) => done(err))
                )
            )
        )
    })

    test("Returns 200: all the transaction of the user 'tester' with 2023-04-19 <= date <= 2023-05-19 - user access", (done) => {
        User.insertMany([
            {
                username: "tester",
                email: "tester@test.com",
                password: "tester",
                refreshToken: testerAccessTokenValid
            }, {
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }
        ]).then(
            categories.insertMany([{
                type: "food",
                color: "red"
            },{
                type: "MtG cards",
                color: "multicolor"
            }]).then(
                transactions.insertMany([
                    {
                        username:"tester",
                        amount:100,
                        type:"food",
                        date:"2023-05-19T10:00:00Z"
                    },
                    {
                        username:"tester",
                        amount: -1,
                        type:"papers",
                        date:"2023-06-19T10:00:00Z"
                    },
                    {
                        username:"tester",
                        amount:45,
                        type:"MtG cards",
                        date:"2023-05-19T10:00:00Z"
                    }
                ]).then(
                    request(app)
                    .get("/api/users/tester/transactions?from=2023-04-19&upTo=2023-05-19")
                    .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
                    .then((response) => {
                        expect(response.status).toBe(200)
                        expect(response.body.data).toHaveLength(2)
                        expect(response.body.data[0]).toStrictEqual({ username:"tester", amount:100, type:"food", date:"2023-05-19T10:00:00.000Z", color:"red"})
                        expect(response.body.data[1]).toStrictEqual({ username:"tester", amount:45, type:"MtG cards", date:"2023-05-19T10:00:00.000Z", color:"multicolor"}) 
                        done() // Notify Jest that the test is complete
                    })
                    .catch((err) => done(err))
                )
            )
        )
    })

    test("Returns 200: all the transaction of the user 'tester' with date = 2023-04-19 - user access", (done) => {
        User.insertMany([
            {
                username: "tester",
                email: "tester@test.com",
                password: "tester",
                refreshToken: testerAccessTokenValid
            }, {
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }
        ]).then(
            categories.insertMany([{
                type: "food",
                color: "red"
            },{
                type: "MtG cards",
                color: "multicolor"
            }]).then(
                transactions.insertMany([
                    {
                        username:"tester",
                        amount:100,
                        type:"food",
                        date:"2023-05-19T10:00:00Z"
                    },
                    {
                        username:"admin",
                        amount: -1,
                        type:"papers",
                        date:"2023-04-19T10:00:00Z"
                    },
                    {
                        username:"tester",
                        amount:45,
                        type:"MtG cards",
                        date:"2023-04-19T10:00:00Z"
                    }
                ]).then(
                    request(app)
                    .get("/api/users/tester/transactions?date=2023-04-19")
                    .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
                    .then((response) => {
                        expect(response.status).toBe(200)
                        expect(response.body.data).toHaveLength(1)
                        expect(response.body.data[0]).toStrictEqual({ username:"tester", amount:45, type:"MtG cards", date:"2023-04-19T10:00:00.000Z", color:"multicolor"}) 
                        done() // Notify Jest that the test is complete
                    })
                    .catch((err) => done(err))
                )
            )
        )
    })

    test("Returns 400: gets an error when using both date and upTo/from", (done) => {
        User.insertMany([
            {
                username: "tester",
                email: "tester@test.com",
                password: "tester",
                refreshToken: testerAccessTokenValid
            }, {
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }
        ]).then(
            categories.insertMany([{
                type: "food",
                color: "red"
            },{
                type: "MtG cards",
                color: "multicolor"
            }]).then(
                transactions.insertMany([
                    {
                        username:"tester",
                        amount:100,
                        type:"food",
                        date:"2023-05-19T10:00:00Z"
                    },
                    {
                        username:"admin",
                        amount: -1,
                        type:"papers",
                        date:"2023-04-19T10:00:00Z"
                    },
                    {
                        username:"tester",
                        amount:45,
                        type:"MtG cards",
                        date:"2023-04-19T10:00:00Z"
                    }
                ]).then(
                    request(app)
                    .get("/api/users/tester/transactions?date=2023-04-19&from=2023-04-19")
                    .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
                    .then((response) => {
                        expect(response.status).toBe(400)
                        expect(response.body.error).toBe("Single date and interval selected") 
                        done() // Notify Jest that the test is complete
                    })
                    .catch((err) => done(err))
                )
            )
        )
    })

    test("Returns 400: gets an error when passing an invalid date format", (done) => {
        User.insertMany([
            {
                username: "tester",
                email: "tester@test.com",
                password: "tester",
                refreshToken: testerAccessTokenValid
            }, {
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }
        ]).then(
            categories.insertMany([{
                type: "food",
                color: "red"
            },{
                type: "MtG cards",
                color: "multicolor"
            }]).then(
                transactions.insertMany([
                    {
                        username:"tester",
                        amount:100,
                        type:"food",
                        date:"2023-05-19T10:00:00Z"
                    },
                    {
                        username:"admin",
                        amount: -1,
                        type:"papers",
                        date:"2023-04-19T10:00:00Z"
                    },
                    {
                        username:"tester",
                        amount:45,
                        type:"MtG cards",
                        date:"2023-04-19T10:00:00Z"
                    }
                ]).then(
                    request(app)
                    .get("/api/users/tester/transactions?date=19-04-2023")
                    .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
                    .then((response) => {
                        expect(response.status).toBe(400)
                        expect(response.body.error).toBe("Invalid date format, please use 'YYYY-MM-DD'") 
                        done() // Notify Jest that the test is complete
                    })
                    .catch((err) => done(err))
                )
            )
        )
    })

    test("Returns 200: [] because the user 'tester' has no transactions - user access", (done) => {
        User.insertMany([
            {
                username: "tester",
                email: "tester@test.com",
                password: "tester",
                refreshToken: testerAccessTokenValid
            }, {
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }
        ]).then(
            categories.insertMany([{
                type: "food",
                color: "red"
            },{
                type: "MtG cards",
                color: "multicolor"
            }]).then(
                transactions.insertMany([
                    {
                        username:"nottester",
                        amount:100,
                        type:"food",
                        date:"2023-05-19T10:00:00Z"
                    },
                    {
                        username:"admin",
                        amount: -1,
                        type:"papers",
                        date:"2023-05-19T10:00:00Z"
                    },
                    {
                        username:"nottester",
                        amount:45,
                        type:"MtG cards",
                        date:"2023-05-19T10:00:00Z"
                    }
                ]).then(
                    request(app)
                    .get("/api/users/tester/transactions/")
                    .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
                    .then((response) => {
                        expect(response.status).toBe(200)
                        expect(response.body.data).toHaveLength(0)
                        done() // Notify Jest that the test is complete
                    })
                    .catch((err) => done(err))
                )
            )
        )
    })
})

describe("getTransactionsByUserByCategory", () => { 
    test("Returns 401: because the calling user is not an admin on admin route", (done) => {
        request(app)
        .get("/api/transactions/users/tester/category/categoryType")
        .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(401)
            expect(response.body.error).toBe("Not admin role")
            done() // Notify Jest that the test is complete
        })
        .catch((err) => done(err))
    })
    
    test("Returns 401: because the calling user is not the route one", (done) => {
        request(app)
        .get("/api/users/nottester/transactions/category/categoryType")
        .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(401)
            expect(response.body.error).toBe("The user can only access information about his account!")
            done() // Notify Jest that the test is complete
        })
        .catch((err) => done(err))
    })

    test("Returns 400: the required user is not present", (done) => {
        request(app)
        .get("/api/users/tester/transactions/category/categoryType")
        .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(400)
            expect(response.body.error).toBe("No such User")
            done() // Notify Jest that the test is complete
        })
        .catch((err) => done(err))
    })

    test("Returns 400: the required category is not present", (done) => {
        User.insertMany([
            {
                username: "tester",
                email: "tester@test.com",
                password: "tester",
                refreshToken: testerAccessTokenValid
            }, {
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }
        ]).then(
            request(app)
            .get("/api/transactions/users/tester/category/falseCategory")
            .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
            .then((response) => {
                expect(response.status).toBe(400)
                expect(response.body.error).toBe("No such Category")
                done() // Notify Jest that the test is complete
            })
            .catch((err) => done(err))
        )
    })

    test("Returns 200: all transactions of user 'tester' with category 'food'", (done) => {
        User.insertMany([
            {
                username: "tester",
                email: "tester@test.com",
                password: "tester",
                refreshToken: testerAccessTokenValid
            }, {
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }
        ]).then(
            categories.insertMany([{
                type: "food",
                color: "red"
            },{
                type: "MtG cards",
                color: "multicolor"
            }]).then(
                transactions.insertMany([
                    {
                        username:"tester",
                        amount:100,
                        type:"food",
                        date:"2023-05-19T10:00:00Z"
                    },
                    {
                        username:"admin",
                        amount: -1,
                        type:"papers",
                        date:"2023-05-19T10:00:00Z"
                    },
                    {
                        username:"tester",
                        amount:45,
                        type:"MtG cards",
                        date:"2023-05-19T10:00:00Z"
                    }
                ]).then(
                    request(app)
                    .get("/api/transactions/users/tester/category/food")
                    .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
                    .then((response) => {
                        expect(response.status).toBe(200)
                        expect(response.body.data).toHaveLength(1)
                        expect(response.body.data[0]).toStrictEqual({
                            username:"tester",
                            amount:100,
                            type:"food",
                            date:"2023-05-19T10:00:00.000Z",
                            color:"red"
                        })
                        done() // Notify Jest that the test is complete
                    })
                    .catch((err) => done(err))
                )
            )
        )
    })

    test("Returns 200: [] because the user 'tester' has no transactions with category 'food'", (done) => {
        User.insertMany([
            {
                username: "tester",
                email: "tester@test.com",
                password: "tester",
                refreshToken: testerAccessTokenValid
            }, {
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminAccessTokenValid,
                role: "Admin"
            }
        ]).then(
            categories.insertMany([{
                type: "food",
                color: "red"
            },{
                type: "MtG cards",
                color: "multicolor"
            }]).then(
                transactions.insertMany([
                    {
                        username:"nottester",
                        amount:100,
                        type:"food",
                        date:"2023-05-19T10:00:00Z"
                    },
                    {
                        username:"admin",
                        amount: -1,
                        type:"papers",
                        date:"2023-05-19T10:00:00Z"
                    },
                    {
                        username:"tester",
                        amount:45,
                        type:"MtG cards",
                        date:"2023-05-19T10:00:00Z"
                    }
                ]).then(
                    request(app)
                    .get("/api/users/tester/transactions/category/food")
                    .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
                    .then((response) => {
                        expect(response.status).toBe(200)
                        expect(response.body.data).toHaveLength(0)
                        done() // Notify Jest that the test is complete
                    })
                    .catch((err) => done(err))
                )
            )
        )
    })
})

describe("getTransactionsByGroup", () => { 
    test("Returns 400: the required group is not present - admin access", (done) => {
        request(app)
        .get("/api/transactions/groups/falseGroup")
        .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(400)
            expect(response.body.error).toBe("No such Group")
            done() // Notify Jest that the test is complete
        })
        .catch((err) => done(err))
    })

    test("Returns 400: the required group is not present - user access", (done) => {
        request(app)
        .get("/api/groups/falseGroup/transactions")
        .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(400)
            expect(response.body.error).toBe("No such Group")
            done() // Notify Jest that the test is complete
        })
        .catch((err) => done(err))
    })

    test("Returns 401: because the calling user is not an admin on admin route", (done) => {
        Group.create({
            name:"testgroup",
            members:[
                {
                    email:"tester@test.com"
                },
                {
                    email:"admin@email.com"
                }
            ]
        }).then(
            request(app)
            .get("/api/transactions/groups/testgroup")
            .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
            .then((response) => {
                expect(response.status).toBe(401)
                expect(response.body.error).toBe("Not admin role")
                done() // Notify Jest that the test is complete
            })
            .catch((err) => done(err))
        )
    })
    
    test("Returns 401: because the calling user is not the group on user route", (done) => {
        Group.create({
            name:"testgroup",
            members:[
                {
                    email:"nottester@test.com"
                },
                {
                    email:"admin@email.com"
                }
            ]
        }).then(
            request(app)
            .get("/api/groups/testgroup/transactions")
            .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
            .then((response) => {
                expect(response.status).toBe(401)
                expect(response.body.error).toBe("Email is not included in the group emails")
                done() // Notify Jest that the test is complete
            })
            .catch((err) => done(err))
        )
    })

    test("Returns 200: all transactions of group 'testgroup'", (done) => {
        Group.insertMany([
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
                        email:"otheradmin@email.com"
                    }
                ]
            }
        ]).then(
            User.insertMany([
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
                }
            ]).then(
                categories.insertMany([{
                    type: "food",
                    color: "red"
                },{
                    type: "papers",
                    color: "white"
                }]).then(
                    transactions.insertMany([
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
                    ]).then(
                        request(app)
                        .get("/api/groups/testgroup/transactions")
                        .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
                        .then((response) => {
                            expect(response.status).toBe(200)
                            expect(response.body.data).toHaveLength(2)
                            expect(response.body.data[0]).toStrictEqual({
                                username:"tester",
                                amount:100,
                                type:"food",
                                date:"2023-05-19T10:00:00.000Z",
                                color:"red"
                            })
                            expect(response.body.data[1]).toStrictEqual({
                                username:"felice",
                                amount:-1,
                                type:"papers",
                                date:"2023-05-19T10:00:00.000Z",
                                color:"white"
                            })
                            done() // Notify Jest that the test is complete
                        })
                        .catch((err) => done(err))
                    )
                )
            )
        )
        
    })

    test("Returns 200: [] because the users in group 'testgroup' have no transactions", (done) => {
        Group.insertMany([
            {
                name:"testgroup",
                members:[
                    {
                        email:"tester@test.com"
                    },
                    {
                        email:"admin@email.com"
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
                        email:"otheradmin@email.com"
                    }
                ]
            }
        ]).then(
            User.insertMany([
                {
                    username: "tester",
                    email: "tester@test.com",
                    password: "tester",
                    refreshToken: testerAccessTokenValid
                }, {
                    username: "admin",
                    email: "admin@email.com",
                    password: "admin",
                    refreshToken: adminAccessTokenValid,
                    role: "Admin"
                }
            ]).then(
                categories.insertMany([{
                    type: "food",
                    color: "red"
                },{
                    type: "papers",
                    color: "white"
                }]).then(
                    transactions.insertMany([
                        {
                            username:"othertester",
                            amount:100,
                            type:"food",
                            date:"2023-05-19T10:00:00Z"
                        },
                        {
                            username:"otheradmin",
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
                    ]).then(
                        request(app)
                        .get("/api/transactions/groups/testgroup")
                        .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
                        .then((response) => {
                            expect(response.status).toBe(200)
                            expect(response.body.data).toHaveLength(0)
                            done() // Notify Jest that the test is complete
                        })
                        .catch((err) => done(err))
                    )
                )
            )
        )
    })

})

describe("getTransactionsByGroupByCategory", () => { 
    test("Returns 400: the required group is not present - admin access", (done) => {
        request(app)
        .get("/api/transactions/groups/falseGroup/category/falseCategory")
        .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(400)
            expect(response.body.error).toBe("No such Group")
            done() // Notify Jest that the test is complete
        })
        .catch((err) => done(err))
    })

    test("Returns 400: the required group is not present - user access", (done) => {
        request(app)
        .get("/api/groups/falseGroup/transactions/category/falseCategory")
        .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(400)
            expect(response.body.error).toBe("No such Group")
            done() // Notify Jest that the test is complete
        })
        .catch((err) => done(err))
    })

    test("Returns 401: because the calling user is not an admin on admin route", (done) => {
        Group.create({
            name:"testgroup",
            members:[
                {
                    email:"tester@test.com"
                },
                {
                    email:"admin@email.com"
                }
            ]
        }).then(
            request(app)
            .get("/api/transactions/groups/testgroup/category/falseCategory")
            .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
            .then((response) => {
                expect(response.status).toBe(401)
                expect(response.body.error).toBe("Not admin role")
                done() // Notify Jest that the test is complete
            })
            .catch((err) => done(err))
        )
    })
    
    test("Returns 401: because the calling user is not the group on user route", (done) => {
        Group.create({
            name:"testgroup",
            members:[
                {
                    email:"nottester@test.com"
                },
                {
                    email:"admin@email.com"
                }
            ]
        }).then(
            request(app)
            .get("/api/groups/testgroup/transactions/category/falseCategory")
            .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
            .then((response) => {
                expect(response.status).toBe(401)
                expect(response.body.error).toBe("Email is not included in the group emails")
                done() // Notify Jest that the test is complete
            })
            .catch((err) => done(err))
        )
    })

    test("Returns 400: because the required category is present", (done) => {
        Group.create({
            name:"testgroup",
            members:[
                {
                    email:"tester@test.com"
                },
                {
                    email:"admin@email.com"
                }
            ]
        }).then(
            request(app)
            .get("/api/groups/testgroup/transactions/category/falseCategory")
            .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
            .then((response) => {
                expect(response.status).toBe(400)
                expect(response.body.error).toBe("No such Category")
                done() // Notify Jest that the test is complete
            })
            .catch((err) => done(err))
        )
    })

    test("Returns 200: all transactions of group 'testgroup' with category 'papers", (done) => {
        Group.insertMany([
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
                        email:"otheradmin@email.com"
                    }
                ]
            }
        ]).then(
            User.insertMany([
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
                }
            ]).then(
                categories.insertMany([{
                    type: "food",
                    color: "red"
                },{
                    type: "papers",
                    color: "white"
                }]).then(
                    transactions.insertMany([
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
                    ]).then(
                        request(app)
                        .get("/api/groups/testgroup/transactions/category/papers")
                        .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
                        .then((response) => {
                            expect(response.status).toBe(200)
                            expect(response.body.data).toHaveLength(1)
                            expect(response.body.data[0]).toStrictEqual({
                                username:"felice",
                                amount:-1,
                                type:"papers",
                                date:"2023-05-19T10:00:00.000Z",
                                color:"white"
                            })
                            done() // Notify Jest that the test is complete
                        })
                        .catch((err) => done(err))
                    )
                )
            )
        )
        
    })

    test("Returns 200: [] because the users in group 'testgroup' have no transactions with category 'food'", (done) => {
        Group.insertMany([
            {
                name:"testgroup",
                members:[
                    {
                        email:"tester@test.com"
                    },
                    {
                        email:"admin@email.com"
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
                        email:"otheradmin@email.com"
                    }
                ]
            }
        ]).then(
            User.insertMany([
                {
                    username: "tester",
                    email: "tester@test.com",
                    password: "tester",
                    refreshToken: testerAccessTokenValid
                }, {
                    username: "admin",
                    email: "admin@email.com",
                    password: "admin",
                    refreshToken: adminAccessTokenValid,
                    role: "Admin"
                }
            ]).then(
                categories.insertMany([{
                    type: "food",
                    color: "red"
                },{
                    type: "papers",
                    color: "white"
                }]).then(
                    transactions.insertMany([
                        {
                            username:"admin",
                            amount: -1,
                            type:"papers",
                            date:"2023-05-19T10:00:00Z"
                        },
                        {
                            username:"tester",
                            amount:45,
                            type:"papers",
                            date:"2023-05-19T10:00:00Z"
                        }
                    ]).then(
                        request(app)
                        .get("/api/transactions/groups/testgroup/category/food")
                        .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
                        .then((response) => {
                            expect(response.status).toBe(200)
                            expect(response.body.data).toHaveLength(0)
                            done() // Notify Jest that the test is complete
                        })
                        .catch((err) => done(err))
                    )
                )
            )
        )
    })

    test("Returns 200: [] because the users in group 'testgroup' have no transactions at all", (done) => {
        Group.insertMany([
            {
                name:"testgroup",
                members:[
                    {
                        email:"tester@test.com"
                    },
                    {
                        email:"admin@email.com"
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
                        email:"otheradmin@email.com"
                    }
                ]
            }
        ]).then(
            User.insertMany([
                {
                    username: "tester",
                    email: "tester@test.com",
                    password: "tester",
                    refreshToken: testerAccessTokenValid
                }, {
                    username: "admin",
                    email: "admin@email.com",
                    password: "admin",
                    refreshToken: adminAccessTokenValid,
                    role: "Admin"
                }
            ]).then(
                categories.insertMany([{
                    type: "food",
                    color: "red"
                },{
                    type: "papers",
                    color: "white"
                }]).then(
                    transactions.insertMany([
                        {
                            username:"otheradmin",
                            amount: -1,
                            type:"papers",
                            date:"2023-05-19T10:00:00Z"
                        },
                        {
                            username:"othertester",
                            amount:45,
                            type:"papers",
                            date:"2023-05-19T10:00:00Z"
                        }
                    ]).then(
                        request(app)
                        .get("/api/transactions/groups/testgroup/category/food")
                        .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
                        .then((response) => {
                            expect(response.status).toBe(200)
                            expect(response.body.data).toHaveLength(0)
                            done() // Notify Jest that the test is complete
                        })
                        .catch((err) => done(err))
                    )
                )
            )
        )
    })
})

describe("deleteTransaction", () => { 
    test("Returns 401: because the calling user is not the route one", (done) => {
        request(app)
        .delete("/api/users/nottester/transactions")
        .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(401)
            expect(response.body.error).toBe("The user can only access information about his account!")
            done() // Notify Jest that the test is complete
        })
        .catch((err) => done(err))
    })

    test("Returns 400: the request body does not contain the requested attributes", (done) => {
        request(app)
        .delete("/api/users/tester/transactions")
        .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
        .send({})
        .then((response) => {
            expect(response.status).toBe(400)
            expect(response.body.error).toBe("Missing or empty id in request body")
            done() // Notify Jest that the test is complete
        })
        .catch((err) => done(err))
    })

    test("Returns 400: '_id' in the request body is empty'", (done) => {
        request(app)
        .delete("/api/users/tester/transactions")
        .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
        .send({_id:""})
        .then((response) => {
            expect(response.status).toBe(400)
            expect(response.body.error).toBe("Missing or empty id in request body")
            done() // Notify Jest that the test is complete
        })
        .catch((err) => done(err))
    })

    test("Returns 400: the params user does not exist", (done) => {
        request(app)
        .delete("/api/users/tester/transactions")
        .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
        .send({_id:"idtest"})
        .then((response) => {
            expect(response.status).toBe(400)
            expect(response.body.error).toBe("No such User")
            done() // Notify Jest that the test is complete
        })
        .catch((err) => done(err))
    })

    test("Returns 400: no such transaction associated to the requesting user", (done) => {
        User.create({
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerAccessTokenValid
        }).then(
            request(app)
            .delete("/api/users/tester/transactions")
            .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
            .send({_id:"41224d776a326fb40f000001"}) //random valid id
            .then((response) => {
                expect(response.status).toBe(400)
                expect(response.body.error).toBe("No such transaction for this user")
                done() // Notify Jest that the test is complete
            })
            .catch((err) => done(err))
        )
    })

    test("Returns 200: Succesfully deleted a transaction", (done) => {
        transactions.create({
            username:"tester",
            amount:100,
            type:"food",
            date:"2023-05-19T10:00:00Z"
        }).then((newTransaction) => {
            const validId = newTransaction._id;
            User.create({
                username: "tester",
                email: "tester@test.com",
                password: "tester",
                refreshToken: testerAccessTokenValid
            }).then(
                request(app)
                .delete("/api/users/tester/transactions")
                .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
                .send({_id:validId}) //random valid id
                .then((response) => {
                    expect(response.status).toBe(200)
                    expect(response.body.data.message).toBe("Transaction deleted")
                    done() // Notify Jest that the test is complete
                })
                .catch((err) => done(err))
            )
        })
    })

})

describe("deleteTransactions", () => { 
    test("Returns 401: because the calling user is not an admin", (done) => {
        request(app)
        .delete("/api/transactions")
        .set("Cookie", `accessToken=${testerAccessTokenValid};refreshToken=${testerAccessTokenValid}`)
        .then((response) => {
            expect(response.status).toBe(401)
            expect(response.body.error).toBe("Not admin role")
            done() // Notify Jest that the test is complete
        })
        .catch((err) => done(err))
    })

    test("Returns 400: the request body does not contain the requested attributes", (done) => {
        request(app)
        .delete("/api/transactions")
        .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
        .send({})
        .then((response) => {
            expect(response.status).toBe(400)
            expect(response.body.error).toBe("Missing ids in request body")
            done() // Notify Jest that the test is complete
        })
        .catch((err) => done(err))
    })

    test("Returns 400: '_ids' in the request body is empty", (done) => {
        request(app)
        .delete("/api/transactions")
        .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
        .send({_ids:[]})
        .then((response) => {
            expect(response.status).toBe(400)
            expect(response.body.error).toBe("Ids array cannot be empty")
            done() // Notify Jest that the test is complete
        })
        .catch((err) => done(err))
    })

    test("Returns 400: one or more values of '_ids' do not correspond to an existing transaction", (done) => {
        transactions.insertMany([
            {
                username:"tester",
                amount:100,
                type:"food",
                date:"2023-05-19T10:00:00Z"
            },
            {
                username:"mattia",
                amount:45,
                type:"MtG cards",
                date:"2023-05-19T10:00:00Z"
            }
        ]).then((returnValue)=>{
            const validId = returnValue[0]._id
            request(app)
            .delete("/api/transactions")
            .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
            .send({_ids:[validId, "41224d776a326fb40f000001"]})
            .then((response) => {
                expect(response.status).toBe(400)
                expect(response.body.error).toBe("One or more ids don't have a corresponding transaction")
                done() // Notify Jest that the test is complete
            })
            .catch((err) => done(err))
        })
    })

    test("Returns 400: one or more values of '_ids' do not correspond to an existing transaction", (done) => {
        transactions.insertMany([
            {
                username:"tester",
                amount:100,
                type:"food",
                date:"2023-05-19T10:00:00Z"
            },
            {
                username:"mattia",
                amount:45,
                type:"MtG cards",
                date:"2023-05-19T10:00:00Z"
            },
            {
                username:"admin",
                amount:45,
                type:"food",
                date:"2023-05-19T10:00:00Z"
            }
        ]).then((returnValue)=>{
            const firstValidId = returnValue[0]._id
            const secondValidId = returnValue[2]._id
            request(app)
            .delete("/api/transactions")
            .set("Cookie", `accessToken=${adminAccessTokenValid};refreshToken=${adminAccessTokenValid}`)
            .send({_ids:[firstValidId, secondValidId]})
            .then((response) => {
                expect(response.status).toBe(200)
                expect(response.body.data.message).toBe("Transactions deleted")
                done() // Notify Jest that the test is complete
            })
            .catch((err) => done(err))
        })
    })
})
