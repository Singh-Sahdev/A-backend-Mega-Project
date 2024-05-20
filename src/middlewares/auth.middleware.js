import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import asyncHandler from "../utils/asyncHandler";
import jwt from 'jsonwebtoken'

export const verifyJwt = asyncHandler( async (req,_,next) =>{
    try {
        const accessToken = req.cookies?.accessToken || req.header('Authorization').replace('Bearer ','')
    
        if(!accessToken){
            throw new ApiError(401,'unauthorized request')
        }
    
        const info = jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(info?._id).select(" -password -refreshToken")
    
        if(!user){
            throw new ApiError(401,'invalid access token')
        }
    
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401,'invalid access token')
    }

})