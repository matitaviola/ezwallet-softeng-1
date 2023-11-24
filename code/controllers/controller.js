import { categories, transactions } from "../models/model.js";
import { Group, User } from "../models/User.js";
import { handleDateFilterParams, handleAmountFilterParams, verifyAuth } from "./utils.js";

/**
 * Create a new category
  - Request Body Content: An object having attributes `type` and `color`
  - Response `data` Content: An object having attributes `type` and `color`
 */
export const createCategory = async (req, res) => {
    try {
        const { type, color } = req.body;

        //************Check if the user that sent the request is an admin***********************//
        const authRet = verifyAuth(req, res, { authType: "Admin" })
        if (authRet.authorized == false) {
            return res.status(401).json({ error: authRet.cause }) // unauthorized
        }

        //*************Checking that req is not contain all the necessary attributesat &&
        // least one of the parameters in the request body is an empty string**************//
        if (!type || type.length === 0 || !color || color.length === 0) {
            return res.status(400).json({
                error: "Request's body is incomplete; it should contain non-empty type and color",
                refreshedTokenMessage: res.locals.refreshedTokenMessage,
            });
        }

        //************Check if a category of this type already exists***********************//
        const ExistedCategory = await categories.findOne({ type: type });
        if (ExistedCategory) {
            return res.status(400).json({
                error: "A category of this type is already present",
                refreshedTokenMessage: res.locals.refreshedTokenMessage,
            });
        }

        //************Create new category***********************//
        const new_category = await categories.create({
            type: type,
            color: color,
        });
        return res.status(200).json({
            data: {
                type: new_category.type,
                color: new_category.color,
            },
            refreshedTokenMessage: res.locals.refreshedTokenMessage,
        });

    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

/**
 * Edit a category's type or color
  - Request Body Content: An object having attributes `type` and `color` equal to the new values to assign to the category
  - Response `data` Content: An object with parameter `message` that confirms successful editing and a parameter `count` that is equal to the count of transactions whose category was changed with the new type
  - Optional behavior:
    - error 401 returned if the specified category does not exist
    - error 401 is returned if new parameters have invalid values
 */
export const updateCategory = async (req, res) => {
    try {

        const oldType = req.params.type;
        const newType = req.body.type;
        const newColor = req.body.color;

        //************Check if the user that sent the request is an admin*****************//
        const check = verifyAuth(req, res, { authType: "Admin" });
        if (!check.authorized) {
            return res.status(401).json({
                error: check.cause,
                refreshedTokenMessage: res.locals.refreshedTokenMessage,
            });
        }

        //************Check if parameters have invalid values***********************// 
        if (oldType == null || newType == null || newColor == null) {
            return res.status(400).json({ error: "Missing values in the parameters or body" });
        }

        //************Check if parameters contain non-empty type and color
        //&& checking if the request body does not contain all the necessary attributes***********// 
        if (!newType || newType.length === 0 || !newColor || newColor.length === 0) {
            return res.status(400).json({
                error: "Request's body is incomplete; it should contain non-empty type and color",
                refreshedTokenMessage: res.locals.refreshedTokenMessage,
            });
        }

        //************Check if the type of category passed as a route parameter
        // does not represent a category in the database***********************// 
        const validCategory = await categories.findOne({
            type: req.params.type,
        });
        if (!validCategory) {
            return res.status(400).json({
                error: "The requested category doesn't exists",
                refreshedTokenMessage: res.locals.refreshedTokenMessage,
            });
        }


        //************Check if the type of category passed in the request body as the new type
        // represents an already existing category in the database***********//
        if (validCategory.type !== newType) {
            const existedType = await categories.findOne({
                type: newType,
            });
            if (existedType) {
                return res.status(400).json({
                    error: "The new category type is already present and belongs to another category",
                    refreshedTokenMessage: res.locals.refreshedTokenMessage,
                });
            }
        }


        //************Updating the category and its transactions with the requested body***********************// 

        let editedTransactionsCount = 0;

        if (newType !== validCategory.type) {
            //update transactions, overwriting their type
            const updatedTransactions = await transactions.updateMany(
                { type: validCategory.type },
                { $set: { type: newType} }
            );
            editedTransactionsCount = updatedTransactions.modifiedCount;
            validCategory.type=newType;
        }

        validCategory.color=newColor;

        await categories.updateOne({type:oldType}, validCategory);
        //.catch(e => {throw({error:"Error when saving the modified category"+validCategory.toJson()})});

        return res.status(200).json({
            data: {
                message: "Category updated successfully",
                count: editedTransactionsCount,
            }, refreshedTokenMessage: res.locals.refreshedTokenMessage
        });

    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

/**
 * Delete a category
  - Request Body Content: An array of strings that lists the `types` of the categories to be deleted
  - Response `data` Content: An object with parameter `message` that confirms successful deletion and a parameter `count` that is equal to the count of affected transactions (deleting a category sets all transactions with that category to have `investment` as their new category)
  - Optional behavior:
    - error 401 is returned if the specified category does not exist
 */
export const deleteCategory = async (req, res) => {
    try {

        const arrayRemove = req.body.types; //requested array of categories's type to be deleted
        let totAffected = 0; //will count the number of updated transactions

        //*************************************************************************/
        //check if the user that sent the request is an admin

        const check = verifyAuth(req, res, { authType: "Admin" });
        if (!check.authorized) {
            return res.status(401).json({
                error: check.cause,
                refreshedTokenMessage: res.locals.refreshedTokenMessage,
            });
        }

        //*************************************************************************/
        //check that the request for removing a category having a type/Not an empty request

        if (!arrayRemove || arrayRemove.length === 0) {
            return res.status(400).json({
                error: "Request's body is incomplete. It should contain a non-empty array of types",
                refreshedTokenMessage: res.locals.refreshedTokenMessage,
            });
        }

        //*************************************************************************/
        //check that there is more than one category

        const categoryCount = await categories.countDocuments(); //Number of available categories
        if (categoryCount === 1) {
            return res.status(400).json({
                error: "There is only one category in the database and it cannot be deleted",
                refreshedTokenMessage: res.locals.refreshedTokenMessage,
            });
        }

        //*************************************************************************/
        //checking none of the string in the array is empty 
        for (const currentType of arrayRemove) {
            if (!currentType || currentType.length === 0)
                return res.status(400).json({
                    error:
                        "Types in the array should not be empty",
                    refreshedTokenMessage: res.locals.refreshedTokenMessage,
                });
        }

        //*************************************************************************/
        //checking all the target categories exist 

        for (const currentType of arrayRemove) {
            const currentCategory = await categories.findOne({
                type: currentType
            });
            if (!currentCategory) {
                //this category doesn't exist
                return res.status(400).json({
                    error:
                        "The category of type '" + currentType + "' doesn't exist",
                    refreshedTokenMessage: res.locals.refreshedTokenMessage,
                });
            }
        }

        //*************************************************************************/
        // (checking the N != T ---number of the requested array to be removed not equall to the total number of exisiting categories)

        if (categoryCount !== arrayRemove.length) {
            //*************************************************************************/
            // get oldest category not in the types array

            let oldestCategory = await categories.findOne(
                { type: { $not: { $in: arrayRemove } } },
                {},
                { sort: { createdAt: 1 } } //oldest: asc by date
            );
            for (const currType of arrayRemove) {
                await categories.findOneAndDelete({
                    type: currType,
                });
                //update transactions by setting their type to that of the oldest category
                const updateOutcome = await transactions.updateMany(
                    { type: currType },
                    { $set: { type: oldestCategory.type } }
                );
                totAffected += updateOutcome.modifiedCount;
            }
        }

        //******************************************************************************/

        // (checking the N = T ---number of the requested array to be removed = number of exisiting categories)
        // Then find the old one and update transaction's category with the old type category

        if (categoryCount === arrayRemove.length) {
            //remove oldest category type from types array
            let oldestCategory = await categories.findOne(
                {},
                {},
                { sort: { createdAt: 1 } } //oldest: asc by date
            );
            for (const currType of arrayRemove) {
                if (currType !== oldestCategory.type) {
                    await categories.findOneAndDelete({
                        type: currType,
                    });
                    let updateOutcome = await transactions.updateMany(
                        { type: currType },
                        { $set: { type: oldestCategory.type } }
                    );
                    totAffected += updateOutcome.modifiedCount;
                }
            }
        }

        //*********************************************************************************/
        res.status(200).json({ data: { message: "Categories deleted", count: totAffected }, refreshedTokenMessage: res.locals.refreshedTokenMessage });
    }catch (error){
        return res.status(400).json({ error: error.message })
    }
}

/**
 * Return all the categories
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `type` and `color`
  - Optional behavior:
    - empty array is returned if there are no categories
 */
export const getCategories = async (req, res) => {
    try {

        //************Check if called by a user who is not authenticated (authType = Simple)********************//
        const check = verifyAuth(req, res, { authType: "Simple" });
        if (!check.authorized) {
            return res.status(401).json({
                error: check.cause,
                refreshedTokenMessage: res.locals.refreshedTokenMessage,
            });
        }

        //************Getting all the categories and format the object********************//
        let allCategories = await categories.find({});

        let formattedResult = allCategories.map(element => Object.assign({}, { type: element.type, color: element.color }));

        res.status(200).json({data: formattedResult, refreshedTokenMessage: res.locals.refreshedTokenMessage })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

/**
 * Create a new transaction made by a specific user
  - Request Body Content: An object having attributes `username`, `type` and `amount`
  - Response `data` Content: An object having attributes `username`, `type`, `amount` and `date`
  - Optional behavior:
    - error 401 is returned if the username or the type of category does not exist
 */
export const createTransaction = async (req, res) => {
    try {
        //Check if requesting user is auth and the same user as the route one

        const authRet = verifyAuth(req, res, { authType: "User", username: req.params.username })
        if (authRet.authorized == false) {
            return res.status(401).json({ error: authRet.cause }) // unauthorized
        }

        const { username, amount, type } = req.body;

        //check for missing or empty body param

        if (!username || !amount || !type) {
            return res.status(400).json({ error: "One or more parameters are missing or empty" });
        }

        //check if amount can't be parsed to  a float
        if (isNaN(parseFloat(amount))) {
            return res.status(400).json({ error: "Not parseable amount" });
        }

        //check for :username and body.username mismatch
        if (!(req.params.username === username)) {
            return res.status(400).json({ error: "User param and body mismatch" });
        }

        //check for username (either params or body one, if we're here it means it's the same value)
        const foundUser = await User.findOne({ username: username });
        if (foundUser == null) {
            return res.status(400).json({ error: "No such User" });
        }

        //check for category
        const foundCategory = await categories.findOne({ type: type });
        if (foundCategory == null) {
            return res.status(400).json({ error: "No such Category" });
        }

        const new_transactions = new transactions({ username, amount, type });

        new_transactions.save()
            .then(data => res.status(200).json({
                data: { username: data.username, amount: data.amount, type: data.type, date: data.date },
                refreshedTokenMessage: res.locals.refreshedTokenMessage
            }))
            //.catch(err => { throw err })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

/**
 * Return all transactions made by all users
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
  - Optional behavior:
    - empty array must be returned if there are no transactions
 */
export const getAllTransactions = async (req, res) => {
    try {
        //Check if is Admin
        const authRet = verifyAuth(req, res, { authType: "Admin" })

        if (authRet.authorized == false) {
            return res.status(401).json({ error: authRet.cause }) // unauthorized
        }
        /**
         * MongoDB equivalent to the query "SELECT * FROM transactions, categories WHERE transactions.type = categories.type"
         */

        transactions.aggregate([
            {
                $lookup: {
                    from: "categories",
                    localField: "type",
                    foreignField: "type",
                    as: "categories_info"
                }
            },
            { $unwind: "$categories_info" }
        ]).then((result) => {
            let data = result.map(v => Object.assign({}, { username: v.username, amount: v.amount, type: v.type, date: v.date, color: v.categories_info.color }));
            res.status(200).json({ data: data, refreshedTokenMessage: res.locals.refreshedTokenMessage });
        })//.catch(error => { throw (error) })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

/**
 * Return all transactions made by a specific user
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
  - Optional behavior:
    - error 401 is returned if the user does not exist
    - empty array is returned if there are no transactions made by the user
    - if there are query parameters and the function has been called by a Regular user then the returned transactions must be filtered according to the query parameters
 */
export const getTransactionsByUser = async (req, res) => {
    try {
        //Distinction between route accessed by Admins or Regular users for functions that can be called by both
        //and different behaviors and access rights
        if (req.url.indexOf("/transactions/users/") >= 0) {
            //ADMIN

            //Check if is Admin
            const authRet = verifyAuth(req, res, { authType: "Admin" })
            if (authRet.authorized == false) {
                return res.status(401).json({ error: authRet.cause }) // unauthorized
            }
            //check for user
            const targetUser = await User.findOne({ username: req.params.username });
            if (targetUser == null) {
                return res.status(400).json({ error: "No such User" });
            }

            transactions.aggregate([
                {
                    $match: {
                        username: req.params.username

                    }
                },
                {
                    $lookup: {
                        from: "categories",
                        localField: "type",
                        foreignField: "type",
                        as: "categories_info"
                    }
                },
                { $unwind: "$categories_info" }
            ]).then((result) => {
                let data = result.map(v => Object.assign({}, { username: v.username, amount: v.amount, type: v.type, date: v.date, color: v.categories_info.color }));
                res.status(200).json({ data: data, refreshedTokenMessage: res.locals.refreshedTokenMessage });
            })//.catch(error => { throw (error) })
        } else {
            //USER
            //Check if requesting user is auth and the same user as the route one
            const authRet = verifyAuth(req, res, { authType: "User", username: req.params.username })
            if (authRet.authorized == false) {
                return res.status(401).json({ error: authRet.cause }) // unauthorized
            }
            //check for user
            const targetUser = await User.findOne({ username: req.params.username });
            if (targetUser == null) {
                return res.status(400).json({ error: "No such User" });
            }

            let date = handleDateFilterParams(req);
            let amount = handleAmountFilterParams(req);

            let filter = { username: req.params.username };
            if (date.date)
                filter.date = date.date;
            if (amount.amount)
                filter.amount = amount.amount;

            transactions.aggregate([
                {
                    $match: filter
                },
                {
                    $lookup: {
                        from: "categories",
                        localField: "type",
                        foreignField: "type",
                        as: "categories_info"
                    }
                },
                { $unwind: "$categories_info" },

            ]).then((result) => {
                let data = result.map(v => Object.assign({}, { username: v.username, amount: v.amount, type: v.type, date: v.date, color: v.categories_info.color }));
                res.status(200).json({ data: data, refreshedTokenMessage: res.locals.refreshedTokenMessage });
            })//.catch(error => { throw (error) })
        }
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

/**
 * Return all transactions made by a specific user filtered by a specific category
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`, filtered so that `type` is the same for all objects
  - Optional behavior:
    - empty array is returned if there are no transactions made by the user with the specified category
    - error 401 is returned if the user or the category does not exist
 */
export const getTransactionsByUserByCategory = async (req, res) => {
    try {
        let filter = { username: req.params.username };
        if (req.url.indexOf("/transactions/users/") >= 0) {
            //ADMIN
            //Check if is Admin
            const authRet = verifyAuth(req, res, { authType: "Admin" })
            if (authRet.authorized == false) {
                return res.status(401).json({ error: authRet.cause }) // unauthorized
            }
        } else {
            //USER
            //Check if requesting user is auth and the same user as the route one
            const authRet = verifyAuth(req, res, { authType: "User", username: req.params.username });

            if (authRet.authorized == false) {
                return res.status(401).json({ error: authRet.cause }) // unauthorized
            }
        }

        const username = req.params.username;
        const typeCat = req.params.category;

        //check for username
        const foundUser = await User.findOne({ username: username });
        if (foundUser == null) {
            return res.status(400).json({ error: "No such User" });
        }

        //check for category
        const foundCategory = await categories.findOne({ type: typeCat });
        if (foundCategory == null) {
            return res.status(400).json({ error: "No such Category" });
        }

        transactions.aggregate([
            {
                $match: filter
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "type",
                    foreignField: "type",
                    as: "categories_info"
                }
            },
            { $unwind: "$categories_info" }
        ]).then((result) => {
            let data = result.map(v => Object.assign({}, { username: v.username, amount: v.amount, type: v.type, date: v.date, color: v.categories_info.color }))
                .filter(v => {
                    return v.type == typeCat
                });//filter by the required category type
            res.status(200).json({ data: data, refreshedTokenMessage: res.locals.refreshedTokenMessage });
        })//.catch(error => { throw (error) });

    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

/**
 * Return all transactions made by members of a specific group
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
  - Optional behavior:
    - error 401 is returned if the group does not exist
    - empty array must be returned if there are no transactions made by the group
 */
export const getTransactionsByGroup = async (req, res) => {
    try {
        //find all users from the group
        const groupName = req.params.name;
        const foundUsers = await Group.findOne({ name: groupName });
        if (!foundUsers || foundUsers.length == 0) return res.status(400).json({ error: "No such Group" });

        if (req.url.indexOf("/transactions/groups/") >= 0) {
            //ADMIN
            //Check if is Admin
            const authRet = verifyAuth(req, res, { authType: "Admin" })

            if (authRet.authorized == false) {
                return res.status(401).json({ error: authRet.cause }) // unauthorized
            }
        } else {
            //USER
            //Check if requesting user is auth and the same user as the route one
            const authRet = verifyAuth(req, res, { authType: "Group", members: foundUsers.members.map((mem)=>mem.email) });

            if (authRet.authorized == false) {
                return res.status(401).json({ error: authRet.cause }) // unauthorized
            }
        }

        const mappedTransactions = await Promise.all(foundUsers.members.map((member) =>
            User.findOne({email:member.email}).then((user) => {
            return transactions.aggregate([
                {
                    $match: {
                        username: user.username
                    }
                },
                {
                    $lookup: {
                        from: "categories",
                        localField: "type",
                        foreignField: "type",
                        as: "categories_info"
                    }
                },
                { $unwind: "$categories_info" }
            ]).then((result) => {
                //checks for empty transactions
                let data = [];
                if (result && Object.keys(result).length !== 0)
                    data = result.map(v => Object.assign({}, { username: v.username, amount: v.amount, type: v.type, date: v.date, color: v.categories_info.color }));
                return data;
            })//.catch(e => {throw(e)});
        }))).then(results => results.flat())//.catch(e => {throw(e)});

        res.status(200).json({ data: mappedTransactions, refreshedTokenMessage: res.locals.refreshedTokenMessage });

    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

/**
 * Return all transactions made by members of a specific group filtered by a specific category
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`, filtered so that `type` is the same for all objects.
  - Optional behavior:
    - error 401 is returned if the group or the category does not exist
    - empty array must be returned if there are no transactions made by the group with the specified category
 */
export const getTransactionsByGroupByCategory = async (req, res) => {
    try {
        //find all users from the group
        const groupName = req.params.name;
        const foundUsers = await Group.findOne({ name: groupName });
        if (!foundUsers || foundUsers.length == 0) return res.status(400).json({ error: "No such Group" });

        if (req.url.indexOf("/transactions/groups/") >= 0) {
            //ADMIN
            //Check if is Admin
            const authRet = verifyAuth(req, res, { authType: "Admin" })

            if (authRet.authorized == false) {
                return res.status(401).json({ error: authRet.cause }) // unauthorized
            }
        } else {
            //USER
            const authRet = verifyAuth(req, res, { authType: "Group", members: foundUsers.members.map((mem)=>mem.email) });

            if (authRet.authorized == false) {
                return res.status(401).json({ error: authRet.cause }) // unauthorized
            }
        }

        const typeCat = req.params.category;

        //check for category
        const foundCategory = await categories.findOne({ type: typeCat });
        if (foundCategory == null) {
            return res.status(400).json({ error: "No such Category" });
        }

        const mappedTransactions = await Promise.all(foundUsers.members.map((member) => User.findOne({email:member.email}).then((user) => {
            return transactions.aggregate([
                {
                    $match: {
                        username: user.username
                    }
                },
                {
                    $lookup: {
                        from: "categories",
                        localField: "type",
                        foreignField: "type",
                        as: "categories_info"
                    }
                },
                { $unwind: "$categories_info" }
            ]).then((result) => {
                //checks for empty transactions
                let data = [];
                if (result && Object.keys(result).length !== 0)
                    data = result.map(v => Object.assign({}, { username: v.username, amount: v.amount, type: v.type, date: v.date, color: v.categories_info.color }))
                        .filter(v => v.type == typeCat);
                return data;
            })//.catch(e => {throw(e)});
        }))).then(results => results.flat())//.catch(e => {throw(e)});

        res.status(200).json({ data: mappedTransactions, refreshedTokenMessage: res.locals.refreshedTokenMessage });
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

/**
 * Delete a transaction made by a specific user
  - Request Body Content: The `_id` of the transaction to be deleted
  - Response `data` Content: A string indicating successful deletion of the transaction
  - Optional behavior:
    - error 401 is returned if the user or the transaction does not exist
 */
export const deleteTransaction = async (req, res) => {
    try {
        //Check if requesting user is auth and the same user as the route one
        const authRet = verifyAuth(req, res, { authType: "User", username: req.params.username })
        if (authRet.authorized == false) {
            return res.status(401).json({ error: authRet.cause }) // unauthorized
        }

        if (!req.body._id)
            return res.status(400).json({ error: "Missing or empty id in request body" });

        const user = await User.findOne({ username: req.params.username });
        if (!user || user.length == 0)
            return res.status(400).json({ error: "No such User" });

        let toBeDeleted = await transactions.findOne({ _id: req.body._id, username: req.params.username });
        if (!toBeDeleted || Object.keys(toBeDeleted).length == 0) {
            return res.status(400).json({ error: "No such transaction for this user" });
        }

        let data = await transactions.deleteOne({ _id: req.body._id });

        if (data && data.deletedCount == 1)
            return res.status(200).json({ data: { message: "Transaction deleted" }, refreshedTokenMessage: res.locals.refreshedTokenMessage });
        else{
            throw({message: "Something went wrong: Unable to delete the required transaction" })
        }
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

/**
 * Delete multiple transactions identified by their ids
  - Request Body Content: An array of strings that lists the `_ids` of the transactions to be deleted
  - Response `data` Content: A message confirming successful deletion
  - Optional behavior:
    - error 401 is returned if at least one of the `_ids` does not have a corresponding transaction. Transactions that have an id are not deleted in this case
 */
export const deleteTransactions = async (req, res) => {
    try {
        //Check if is Admin
        const authRet = verifyAuth(req, res, { authType: "Admin" })

        if (authRet.authorized == false) {
            return res.status(401).json({ error: authRet.cause }) // unauthorized
        }

        const ids = req.body._ids;

        //check id validity
        if (req.body._ids == null || req.body._ids == undefined)
            return res.status(400).json({ error: "Missing ids in request body" });

        if (ids === undefined || ids.length < 1)
            return res.status(400).json({ error: "Ids array cannot be empty" });
        
        for (const id of ids.values()) {
            if (id.length === 0)
                return res.status(400).json({ error: "Ids cannot be empty" });
        }

        const foundIds = await transactions.find({
            _id: { $in: ids }
        });

        if (!foundIds || foundIds.length != ids.length)
            return res.status(400).json({ error: "One or more ids don't have a corresponding transaction" });


        transactions.deleteMany({ _id: { $in: ids } })
            .then((result) => res.status(200).json({ data: { message: "Transactions deleted" }, refreshedTokenMessage: res.locals.refreshedTokenMessage }))
            //.catch(error => { throw (error) });

    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}
