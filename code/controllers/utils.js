import jwt from 'jsonwebtoken'

/**
 * Handle possible date filtering options in the query parameters for getTransactionsByUser when called by a Regular user.
 * @param req the request object that can contain query parameters
 * @returns an object that can be used for filtering MongoDB queries according to the `date` parameter.
 *  The returned object must handle all possible combination of date filtering parameters, including the case where none are present.
 *  Example: {date: {$gte: "2023-04-30T00:00:00.000Z"}} returns all transactions whose `date` parameter indicates a date from 30/04/2023 (included) onwards
 * @throws an error if the query parameters include `date` together with at least one of `from` or `upTo`
 */
export const handleDateFilterParams = (req) => {

    if(!req.query.date && !req.query.from && !req.query.upTo)
        return {};

    if(req.query.date && (req.query.from || req.query.upTo))
        throw({message:"Single date and interval selected"});

    const regex = new RegExp("([0-9]{4})-((0[0-9])|(1[0-2]))-(([0-2][0-9])|(3[0-1]))");
    if((req.query.from && regex.test(req.query.from) == false ) 
     || (req.query.date && regex.test(req.query.date) == false)
     || (req.query.upTo && regex.test(req.query.upTo) == false)
    ){
        throw({message:"Invalid date format, please use 'YYYY-MM-DD'"});
    }

    if(req.query.from || req.query.upTo){
        if (req.query.from && req.query.upTo) {
            let from = new Date(req.query.from);
            let upTo = new Date(req.query.upTo+"T23:59:59.999Z");
            return { date:{$gte:from, $lte:upTo} };
        }
            
        if(req.query.from){ 
            let from = new Date(req.query.from);
            return {date:{$gte:from}};
        }
                                                                  
        if(req.query.upTo){ 
            let upTo = new Date(req.query.upTo+"T23:59:59.999Z");
            return {date:{$lte:upTo}};
        }
    }
    //I still return a range because using simply a yyyy-mm-dd format would create a "yyyy-mm-ddT00:00:00Z that would be too specific
    if(req.query.date){
        let exactDateStart = new Date(req.query.date);
        let exactDateFinal = new Date(req.query.date+"T23:59:59.999Z");
        return {date:{$gte:exactDateStart, $lte:exactDateFinal}};
    }
}

/**
 * Handle possible authentication modes depending on `authType`
 * @param req the request object that contains cookie information
 * @param res the result object of the request
 * @param info an object that specifies the `authType` and that contains additional information, depending on the value of `authType`
 *      Example: {authType: "Simple"}
 *      Additional criteria:
 *          - authType === "User":
 *              - either the accessToken or the refreshToken have a `username` different from the requested one => error 401
 *              - the accessToken is expired and the refreshToken has a `username` different from the requested one => error 401
 *              - both the accessToken and the refreshToken have a `username` equal to the requested one => success
 *              - the accessToken is expired and the refreshToken has a `username` equal to the requested one => success
 *          - authType === "Admin":
 *              - either the accessToken or the refreshToken have a `role` which is not Admin => error 401
 *              - the accessToken is expired and the refreshToken has a `role` which is not Admin => error 401
 *              - both the accessToken and the refreshToken have a `role` which is equal to Admin => success
 *              - the accessToken is expired and the refreshToken has a `role` which is equal to Admin => success
 *          - authType === "Group":
 *              - either the accessToken or the refreshToken have a `email` which is not in the requested group => error 401
 *              - the accessToken is expired and the refreshToken has a `email` which is not in the requested group => error 401
 *              - both the accessToken and the refreshToken have a `email` which is in the requested group => success
 *              - the accessToken is expired and the refreshToken has a `email` which is in the requested group => success
 * @returns true if the user satisfies all the conditions of the specified `authType` and false if at least one condition is not satisfied
 *  Refreshes the accessToken if it has expired and the refreshToken is still valid
 */
export const verifyAuth = (req, res, info) => {
    const cookie = req.cookies
    if (!cookie.accessToken || !cookie.refreshToken) {
        return ({authorized:false, cause : "Unauthorized"});
    }
    try {
        const decodedAccessToken = jwt.verify(cookie.accessToken, process.env.ACCESS_KEY);
        const decodedRefreshToken = jwt.verify(cookie.refreshToken, process.env.ACCESS_KEY);
        if (!decodedAccessToken.username || !decodedAccessToken.email || !decodedAccessToken.role) {
            return {authorized:false, cause : "Token is missing information"};
        }
        if (!decodedRefreshToken.username || !decodedRefreshToken.email || !decodedRefreshToken.role) {
            return {authorized:false, cause : "Token is missing information"};
        }
        if (decodedAccessToken.username !== decodedRefreshToken.username || decodedAccessToken.email !== decodedRefreshToken.email || decodedAccessToken.role !== decodedRefreshToken.role) {
            return {authorized:false, cause : "Mismatched users"};
        }

        if(info.authType === "Admin"){
            if(decodedAccessToken.role !== "Admin" || decodedRefreshToken.role !== "Admin"  || decodedAccessToken.role !== decodedRefreshToken.role){
                return ({authorized:false, cause : "Not admin role"});
            }
        }else if(info.authType === "Group"){
            //to be checked
           if ((!info.members.includes(decodedAccessToken.email)) || (!info.members.includes(decodedRefreshToken.email))){
                return ({authorized:false,cause: "Email is not included in the group emails"});
            }

        }else if(info.authType === "User"){
            if(decodedAccessToken.username !== info.username || decodedRefreshToken.username !== info.username){
                return ({authorized:false, cause : "The user can only access information about his account!"});
            }
        }

        return { authorized: true, cause: "Authorized" }

       // return res.status(200).json({authorized:true});

    } catch (err) {
        if (err.name === "TokenExpiredError") {
            try {
                const refreshToken = jwt.verify(cookie.refreshToken, process.env.ACCESS_KEY)
                const newAccessToken = jwt.sign({
                    username: refreshToken.username,
                    email: refreshToken.email,
                    id: refreshToken.id,
                    role: refreshToken.role
                }, process.env.ACCESS_KEY, { expiresIn: '1h' })
                res.cookie('accessToken', newAccessToken, { httpOnly: true, path: '/api', maxAge: 60 * 60 * 1000, sameSite: 'none', secure: true })
                res.locals.refreshedTokenMessage= 'Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls'
                return {authorized:true, cause:"Authorized"};
            } catch (err) {
                if (err.name === "TokenExpiredError") {
                    return ({authorized:false, cause:"Perform login again"});
                } else {
                    return ({authorized:false, cause:err.name});
                }
            }
        } else {
            return ({authorized:false, cause:err.name});
        }
    }
}


/**
 * Handle possible amount filtering options in the query parameters for getTransactionsByUser when called by a Regular user.
 * @param req the request object that can contain query parameters
 * @returns an object that can be used for filtering MongoDB queries according to the `amount` parameter.
 *  The returned object must handle all possible combination of amount filtering parameters, including the case where none are present.
 *  Example: {amount: {$gte: 100}} returns all transactions whose `amount` parameter is greater or equal than 100
 */
export const handleAmountFilterParams = (req) => {
    if((!req.query.max && !req.query.min)){
        return {};
    }

    if((req.query.min && isNaN(parseInt(req.query.min))) || (req.query.max && isNaN(parseInt(req.query.max)))){
        throw({message:"min, max or both are not a  number"});
    }

    if(req.query.min && req.query.max){
        return  { amount:{$gte:parseInt(req.query.min), $lte:parseInt(req.query.max)} };
    }
    if(req.query.min){
        return { amount:{$gte:parseInt(req.query.min)} };
    }
    if(req.query.max){
        return { amount:{$lte:parseInt(req.query.max)} };
    }

}