//for wrapping the coming function in this async or promise based function

const asyncHandler = (fn) =>{
    return (req,res,next)=>{
        Promise.resolve(fn(req,res,next)).catch( err => next(err))
    }
}

export {asyncHandler}