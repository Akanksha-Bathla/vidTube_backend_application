// higher order function
// this is done to save us from writing too many try catch blocks in each route handler. 
const asyncHandler = (requestHandler) => {
    return(req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}

export {asyncHandler}