import { Group, User } from "../models/User.js";
import { transactions } from "../models/model.js";
import { verifyAuth } from "./utils.js";
import jwt from 'jsonwebtoken'

/**
 * Return all the users
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `email` and `role`
  - Optional behavior:
    - empty array is returned if there are no users
 */
    export const getUsers = async (req, res) => {
      try {
        const adminAuth = verifyAuth(req, res, { authType: "Admin" })
        
          if (adminAuth.authorized) {
                //Admin auth successful

                //const users = await User.find({},"username email role");
                const users = await User.find({}, { _id: 0, username: 1, email: 1, role: 1 })
                res.status(200).json({ data: users, refreshedTokenMessage: res.locals.refreshedTokenMessage });
          } else {
              res.status(401).json({ error: adminAuth.cause})
          } 
      } catch (error) {
          res.status(500).json(error.message);
      }
  }

/**
 * Return information of a specific user
  - Request Body Content: None
  - Response `data` Content: An object having attributes `username`, `email` and `role`.
  - Optional behavior:
    - error 401 is returned if the user is not found in the system
 */
    export const getUser = async (req, res) => {
      try {
        let user = null;  
        const userAuth = verifyAuth(req, res, { authType: "User", username: req.params.username })
        if (userAuth.authorized) {
          user = await User.findOne({ username: req.params.username }, 'username email role');
          if (!user) {return res.status(400).json({error : 'Username not in database!'})}
        } else {
          const adminAuth = verifyAuth(req, res, { authType: "Admin" })
          if (adminAuth.authorized) {
              //Admin auth successful
              
              user = await User.findOne({ username: req.params.username }, 'username email role');

              if (!user) {return res.status(400).json({error : 'Username not in database!'})}
          } else {
              return res.status(401).json({ error: adminAuth.cause})
          }
        }

            return res.status(200).json({data:{username: user.username, email : user.email,role: user.role},refreshedTokenMessage:res.locals.refreshedTokenMessage})

          } catch (error) {
            res.status(500).json({ error: error.message })
          }
    }

/**
 * Create a new group
  - Request Body Content: An object having a string attribute for the `name` of the group and an array that lists all the `memberEmails`
  - Response `data` Content: An object having an attribute `group` (this object must have a string attribute for the `name`
    of the created group and an array for the `members` of the group), an array that lists the `alreadyInGroup` members
    (members whose email is already present in a group) and an array that lists the `membersNotFound` (members whose email
    +does not appear in the system)
  - Optional behavior:
    - error 401 is returned if there is already an existing group with the same name
    - error 401 is returned if all the `memberEmails` either do not exist or are already in a group
 */
    export const createGroup = async (req, res) => {
      try {
        const cookie = req.cookies
        const authRet = verifyAuth(req, res, {authType:"Simple"})
        if (authRet.authorized == false) {
            return res.status(401).json({ error: authRet.cause }) // unauthorized
        }

        if(!req.body.name || !req.body.memberEmails || req.body.memberEmails.length === 0)
          return res.status(400).json({error:"Missing or empty parameters"});

        const { name, memberEmails } = req.body;

        const userEmail = jwt.verify(cookie.accessToken, process.env.ACCESS_KEY).email;
        const arrayEmailAlready =[];
        const arrayEmailNot =[];
        const arrayEmail =[];
        var mePresent = false;
  
        let finder = await Group.findOne({ name: req.body.name });
        if(finder != null){
            return res.status(400).json({ error: "Group name already used" });
            
        }

        finder = await Group.findOne({ "members.email" : userEmail });
        if(finder != null){
          //checking if the user is already in a group
          return res.status(400).json({error:"You are already in a group"});
          
        }
        
        for (const email1 of memberEmails){

          //Check if any parameter is an empty string
          //whitespaces are also considered empty string
          if(email1.trim() ==="" ){
            return res.status(400).json({ error: "Emails cannot be empty" }); 
          }

          //Check if email is in valid format
          // Check if the email is in a valid format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email1)) {
            return res.status(400).json({ error: "Invalid email format inserted" });
          }

          const app = await User.findOne({ email: email1});
          //checking if the user added in the body
          if(email1 === userEmail ){
              mePresent = true;
          }

          if(app != null){

            finder = await Group.findOne({ "members.email" : email1 });
            if(finder != null){
              //the user is already in a group
              arrayEmailAlready.push({email : email1});   
            }else{
              //not inside a group
              arrayEmail.push({email : email1});
            }                

          }else{
            //email not existing
            arrayEmailNot.push({email : email1});
          }

        }
          
        //checked if all the emails provided are valid we check if the creator added himself, if not we add him
        if(!mePresent){
          arrayEmail.push({email : userEmail});
        }
        if(!arrayEmail[1]){
          return res.status(400).json({error:"Insert valid emails"});
        }


        const new_group = new Group({ name: name, members : arrayEmail});
        
        await new_group.save(); 
        const print_group = await Group.findOne({ name : name },{name : 1, "members.email": 1 , _id: 0})
        return res.status(200).json({
              data:{ group: print_group , membersNotFound : arrayEmailNot, alreadyInGroup: arrayEmailAlready},
              refreshedTokenMessage: res.locals.refreshedTokenMessage
        })
        
      } catch (error) {
          res.status(500).json(error.message);
      }
    }


/**
 * Return all the groups
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having a string attribute for the `name` of the group
    and an array for the `members` of the group
  - Optional behavior:
    - empty array is returned if there are no groups
 */
    export const getGroups = async (req, res) => {
      try {
        const authRet = verifyAuth(req, res, {authType:"Admin"})
        if (authRet.authorized  == false) {
            return res.status(401).json({ error: authRet.cause }) // unauthorized
        
        }else{
    
                //Admin auth successful
                const groups = await Group.find({},{name : 1, "members.email": 1 , _id: 0})
                res.status(200).json({data: groups , refreshedTokenMessage:res.locals.refreshedTokenMessage});       
    
            }
      } catch (error) {
          res.status(500).json(error.message);
      }
    }
/**
 * Return information of a specific group
  - Request Body Content: None
  - Response `data` Content: An object having a string attribute for the `name` of the group and an array for the 
    `members` of the group
  - Optional behavior:
    - error 401 is returned if the group does not exist
 */
  export const getGroup = async (req, res) => {
  try {
    const groupName = req.params.name;
    let groups = await Group.findOne({name: groupName})
    if(!groups)
      return res.status(400).json({ error: "No such Group" })
      
    const adminRet = verifyAuth(req, res, {authType:"Admin", username:req.params.username})
    const groupRet = verifyAuth(req, res, {authType:"Group", members:groups.members.map((mem) => mem.email)})
    if (adminRet.authorized  == false && groupRet.authorized  == false) {
        return res.status(401).json({ error: "Unauthorized" }) // unauthorized
    }    

    //User auth successful
    groups = await Group.findOne({name: groupName},{name : 1, "members.email": 1 , _id: 0});
    
    res.status(200).json({data: groups , refreshedTokenMessage:res.locals.refreshedTokenMessage});      

      
  } catch (error) {
    res.status(500).json(error.message);
  }
  }

/**
 * Add new members to a group
  - Request Body Content: An array of strings containing the emails of the members to add to the group
  - Response `data` Content: An object having an attribute `group` (this object must have a string attribute for the `name` of the
    created group and an array for the `members` of the group, this array must include the new members as well as the old ones), 
    an array that lists the `alreadyInGroup` members (members whose email is already present in a group) and an array that lists 
    the `membersNotFound` (members whose email does not appear in the system)
  - Optional behavior:
    - error 401 is returned if the group does not exist
    - error 401 is returned if all the `memberEmails` either do not exist or are already in a group
 */
export const addToGroup = async (req, res) => {
  try {

    var finder = await Group.findOne({ name: req.params.name });
    if(finder == null){
        return res.status(400).json({ error: "Group not existing" });
        
    }

    //Admin case
    if (req.url.indexOf("insert") >= 0) {
      const authRet = verifyAuth(req, res, {authType:"Admin"})
      if (authRet.authorized== false) {
          return res.status(401).json({ error: authRet.cause }) // unauthorized
      }
    }else{
      //User case
      const cookie = req.cookies
      const authRet = verifyAuth(req, res, {authType:"Group", members:finder.members.map((mem) => mem.email)})
      if (authRet.authorized  == false) {
          return res.status(401).json({ error: authRet.cause }) // not inside the group
      }
    }
    if(!req.params.name || req.params.name.length === 0 || !req.body.emails || req.body.emails.length === 0)
        return res.status(400).json({error:"Missing and/or empty body attributes"})

      const name= req.params.name;
      const memberEmails = req.body.emails;

      const arrayEmailAlready =[];
      const arrayEmailNot =[];
      const arrayEmail =[];
      const newEmail = [];

      for (const email1 of memberEmails){
        //Check if any parameter is an empty string
        //whitespaces are also considered empty string
        if(email1.trim() ==="" ){
          return res.status(400).json({ error: "Emails cannot be empty" }); 
        }

        //Check if email is in valid format
        // Check if the email is in a valid format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email1)) {
          return res.status(400).json({ error: "Invalid email format inserted" });
        }

        const app = await User.findOne({ email: email1});
        if(app != null){
          finder = await Group.findOne({ "members.email" : email1 });

          if(finder != null){
            //the user is already in a group
  
            arrayEmailAlready.push({email : email1});
              
          }else{
            //not inside a group

            arrayEmail.push({email : email1, user:app});
            newEmail.push({email : email1});
          }                

        }else{
          //email not existing
          arrayEmailNot.push({email : email1});
        }
      }
      if(!newEmail[0]){
        return res.status(400).json({error:"Insert valid emails"});
      } 
      const queryRes = await Group.updateOne({ name: name }, {$push: {members: arrayEmail}}); 
      var group = await Group.findOne({name: name},{name : 1, "members.email": 1 , _id: 0});
      return res.status(200).json({
        data:{ group: group , membersNotFound : arrayEmailNot, alreadyInGroup: arrayEmailAlready},
        refreshedTokenMessage: res.locals.refreshedTokenMessage
      })
      
  } catch (error) {
      res.status(500).json(error.message);
  }
}

/**
 * Remove members from a group
  - Request Body Content: An object having an attribute `group` (this object must have a string attribute for the `name` of the
    created group and an array for the `members` of the group, this array must include only the remaining members),
    an array that lists the `notInGroup` members (members whose email is not in the group) and an array that lists 
    the `membersNotFound` (members whose email does not appear in the system)
  - Optional behavior:
    - error 401 is returned if the group does not exist
    - error 401 is returned if all the `memberEmails` either do not exist or are not in the group
 */
  export const removeFromGroup = async (req, res) => {
    try {

      var finder = await Group.findOne({ name: req.params.name });
      if(finder == null){
        return res.status(400).json({ error: "Group not existing" });
      }
        
      if (req.url.indexOf("pull") >= 0) {
        //Admin case
        const authRet = verifyAuth(req, res, {authType:"Admin"})
        if (authRet.authorized== false) {
            return res.status(401).json({ error: authRet.cause }) // unauthorized
        }
      }else {
        //User case
        const authRet = verifyAuth(req, res, {authType:"Group", members:finder.members.map((mem) => mem.email)})
        if (authRet.authorized  == false) {
            return res.status(401).json({ error: authRet.cause }) // not inside the group
        }
      }

      //missing or empty parameters
      if(!req.params.name || req.params.name.length === 0 || !req.body.emails || req.body.emails.length === 0)
        return res.status(400).json({error:"Missing and/or empty body attributes"})

      const name = req.params.name;
      const toDeleteEmails = req.body.emails;

      const emailsNotInGroup =[];
      const emailsNotFound =[];
      const removeMembers = [];
      const oldMembers = finder.members;
      const oldEmails = oldMembers.map((mem) => mem.email);

      if(oldMembers.length === 1){
        return res.status(400).json({ error: "Cannot remove members from a group with only one user" });
      }

      for (const email1 of toDeleteEmails){
          
        //Check if any parameter is an empty string
        //whitespaces are also considered empty string
        if(email1.trim() ==="" ){
          return res.status(400).json({ error: "Emails cannot be empty" }); 
        }

        //Check if email is in valid format
        // Check if the email is in a valid format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email1)) {
          return res.status(400).json({ error: "Invalid email format inserted" });
        }
    
        const app = await User.findOne({ email: email1});

        if(app != null){
          const otherFinder = await Group.findOne({ "members.email" : email1 });
          if(!otherFinder || otherFinder.name != finder.name){
            //the user exists but it's not in this group
            emailsNotInGroup.push({email : email1});   
          }else{
            //teh user is in this group
            removeMembers.push(email1);
          }
        }else{
            //email not existing
            emailsNotFound.push({email : email1});
        }
      }
    
      if(!removeMembers[0]){
        return res.status(400).json({ error: "None of the emails are in this group" });
      }

      //se dovessi eliminare tutti, invece terrei il primo della lista passata
      if(oldMembers.length-removeMembers.length <= 0){
        removeMembers.shift()
      }

      await Group.updateOne({ name: name }, {$pull:{members:{email:{$in:removeMembers}}}}); 
      var group = await Group.findOne({name: name},{name : 1, "members.email": 1 , _id: 0});       
      return res.status(200).json({
            data:{ group: group , membersNotFound : emailsNotFound, notInGroup: emailsNotInGroup},
            refreshedTokenMessage: res.locals.refreshedTokenMessage
        })
    } catch (error) {
        res.status(500).json(error.message);
    }
  }

/**
 * Delete a user
  - Request Parameters: None
  - Request Body Content: A string equal to the `email` of the user to be deleted
  - Response `data` Content: An object having an attribute that lists the number of `deletedTransactions` and a boolean attribute that
    specifies whether the user was also `deletedFromGroup` or not.
  - Optional behavior:
    - error 401 is returned if the user does not exist 
 */
    export const deleteUser = async (req, res) => {
      try {
        const adminAuth = verifyAuth(req,res,{authType:"Admin"});
        if(!adminAuth.authorized){
          return res.status(401).json({error: adminAuth.cause});
        }

        const email = req.body.email
         //Check if all the neccessary atributes are contained
         if(!email){
          return res.status(400).json({ error: "All attributes are required" });
        }
      
        //Check if any parameter is an empty string
        //whitespaces are also considered empty string
        if(email.trim() ===""){
            return res.status(400).json({ error: "Parameters cannot be empty" }); 
        }

        //Check if email is in valid format
        // Check if the email is in a valid format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

        //Email not registred
        const userEmail = req.body.email;
        const user = await User.findOne({ email: userEmail });
        if (!user) return res.status(400).json({ error: "Email not in database" });
      
        if(user.role=="Admin"){
          return res.status(400).json({ error: "Cannot delete an admin this way" });
        }     

        //Remove all users' mails from groups
        const numDelFromGroup = await Group.updateMany({},{
          $pull:{
            members:{email: userEmail}
          }
        });

        //remove groups with empty member arrays
        await Group.deleteMany({members:{$exists:true, $size:0}})

        //Delete user's transactions 
        const deletedTransactions = await transactions.deleteMany({username: user.username});
  
        await User.deleteOne({_id:user._id});
  
        const data = {
          deletedTransactions: deletedTransactions.deletedCount,
          deletedFromGroup: (numDelFromGroup.modifiedCount==0? false:true)
        }
        return res.status(200).json({data:data, refreshedTokenMessage:res.locals.refreshedTokenMessage});
      
      }catch (err) {
          res.status(500).json(err.message)
      }
  }

/**
 * Delete a group
  - Request Body Content: A string equal to the `name` of the group to be deleted
  - Response `data` Content: A message confirming successful deletion
  - Optional behavior:
    - error 401 is returned if the group does not exist
 */
    export const deleteGroup = async (req, res) => {
      try {
            
        const adminAuth = verifyAuth(req,res,{authType:"Admin"});
        if(!adminAuth.authorized){
          return res.status(401).json({error: adminAuth.cause});
        }
    
        if (req.body.name == null){
          return res.status(400).json({ error:"Not all the necessary data was inserted"});
        }
        if (req.body.name == ''){
          return res.status(400).json({ error:"The group name is an empty string"});
        }
    
        const groupName = req.body.name;
    
    
    
       const existing =  await Group.findOne({name : groupName});
       if(existing == null){
        return res.status(400).json( {error:"The group does not exist"});
    
       }
    
        //Delete user transaction 
    
        await Group.deleteOne({name : groupName});
    
        return res.status(200).json({data:{message:"Group deleted succesfully"},refreshedTokenMessage:res.locals.refreshedTokenMessage});
      
      }catch (err) {
          res.status(500).json(err.message)
      }
    }