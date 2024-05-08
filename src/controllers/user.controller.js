import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {User} from '../models/user.model.js';
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req,res,next)=>{
    
    // take text data from req.body
    const {fullName, username, email, password} = req.body

    // validate text data
    if(
        [fullName,username,email,password].some( item => (
            item?.trim()===''
        ))
    ){
        throw new ApiError(400, 'All fields are required')
    }

    // check whether user already exist or not
    const existedUser = await User.findOne({
        $or:[{ email },{ username }]
    })

    if(existedUser){
        throw new ApiError(409, 'User with username or email already exists')
    }

    // accepting files from req.files
    // console.log(req.files)

    let avatarLocalPath = null
    let coverImageLocalPath = null

    if('avatar' in req.files && req.files.avatar.length ){
        avatarLocalPath = req.files.avatar[0].path
    }

    if('coverImage' in req.files && req.files.coverImage.length ){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    // validating files
    if(!avatarLocalPath){
        throw new ApiError(400,'Avatar file is required')
    }

    // uploading files on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);


    if(!avatar){
        throw new ApiError(400,'Avatar file is required')
    }

    // creating entry in db of the user
    const user = await User.create({
        username:username.toLowerCase(),
        email,
        password,
        avatar:avatar.url,
        coverImage:coverImage?.url || '',
        fullName
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    // validating creation of user
    if(!createdUser){
        throw new ApiError(500,'Error while registering the user, Please try again...')
    }

    // sending the response
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registered Successfully")
    )

})

export {registerUser}