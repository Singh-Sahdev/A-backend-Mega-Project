import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {User} from '../models/user.model.js';
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessTokenAndRefreshToken = async (userId) =>{

    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({
            validateBeforeSave:false
        })

        return {accessToken,refreshToken}


    } catch (error) {
        throw new ApiError(500,'something went wrong while generating accesstoken or refresh token')
    }


}

const registerUser = asyncHandler(async (req,res)=>{
    
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



const loginUser = asyncHandler(async (req,res) => {

    // Taking data from frontend
    const {username, email, password} = req.body

    //validating username and email sent from front end
    if(!username || !email){
        throw new ApiError(404,'Username or email is required')
    }

    // finding the user
    const user = await User.findOne({
        $or:[{email},{username}]
    })

    // validating the user 
    if(!user){
        throw new ApiError(401,'User doesnt exist')
    }

    // checking the password of existing user
    const passwordValidate = await user.isPasswordCorrect(password)

    if(!passwordValidate){
        throw new ApiError(402,'Password incorrect ')
    }

    //generating access and refresh token
    const {accessToken,refreshToken} = await generateAccessTokenAndRefreshToken(user._id)

    //updating user
    const newUser = await User.findById(user._id).select(" -password -refreshToken ")

    // sending token to cookies
    const options = {
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie('accessToken',accessToken,options)
    .cookie('refreshToken',refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:newUser,
                accessToken,
                refreshToken
            },
            "user logged in successfully"
        )
    )
})

const logoutUser = asyncHandler( async (req,res) => {
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )

    const options = {
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie('accessToken',options)
    .clearCookie('refreshToken',options)
    .json(
        new ApiResponse(
            200,
            {},
            'User logged Out Successfully'
        )
    )
})

export {registerUser,loginUser,logoutUser}