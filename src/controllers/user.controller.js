import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {User} from '../models/user.model.js';
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from 'jsonwebtoken';
import mongoose from "mongoose";

const options = {
    httpOnly:true,
    secure:true
}

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
    if(!username && !email){
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
            $unset:{
                refreshToken:1
            }
        },
        {
            new:true
        }
    )


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

const refreshAccessToken = asyncHandler(async (req,res)=>{
    const incomingToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingToken){
        throw new ApiError(401,'Unauthorised request')
    }

    try {
        const decodedToken = jwt.verify(incomingToken,process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,'Invalid Refresh Token')
        }
    
        if(incomingToken !== user.refreshToken){
            throw new ApiError(401,'Invalid Refresh Token')
        }
    
        const {accessToken,refreshToken} = await generateAccessTokenAndRefreshToken(user._id)

    
        return res
        .status(200)
        .cookie('accessToken',accessToken,options)
        .cookie('refreshToken',refreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken
                },
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,'Invalid Refresh token')
    }

})

const changeCurrentPassword = asyncHandler(async (req,res)=>{

    const {oldPassword, newPassword} = req.body

    if(!oldPassword || !newPassword){
        throw new ApiError(404,"Both old and new passwords are required")
    }

    const user = await User.findById(req.user._id)

    if(!user){
        throw new ApiError(401,'Invalid Refresh Token')
    }

    const passwordValidation = await user.isPasswordCorrect(oldPassword)

    if(!passwordValidation){
        throw new ApiError(400, 'Invalid old password')
    }

    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            'Password changed successfully'
        )
    )

})

const getCurrentUser = asyncHandler(async (req,res) =>{
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            req.user,
            'current user fetched successfully'
        )
    )

})

const updateAccountDetails = asyncHandler(async (req,res) =>{
    const {fullName,email} = req.body

    if(!fullName || !email){
        throw new ApiError(400,'all fields are required')
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email
            }
        },
        {new:true}
    ).select(' -password -refreshToken')

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            'Account Details updated successfully'
        )
    )

})

const updateUserAvatar = asyncHandler(async (req,res) =>{

    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(404,'Missing avatar file')
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(500,'Error while uploading avatar file')
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select(' -password -refreshToken')

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            'Avatar updated successfully'
        )
    )

})

const updateUserCoverImage = asyncHandler(async (req,res) =>{

    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(404,'Missing cover image file')
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(500,'Error while uploading cover image file')
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
    ).select(' -password -refreshToken')

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            'Cover Image updated successfully'
        )
    )

})

const getUserChannelProfile = asyncHandler(async (req,res)=>{

    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(404,'Username is missing')
    }

    const channel = await User.aggregate([
        {
           $match:{
            username:username?.toLowerCase()
           }
        },
        {
            $lookup:{
                from:'subscriptions',
                localField:'_id',
                foreignField:'channel',
                as:'subscribers'
            }
        },
        {
            $lookup:{
                from:'subscriptions',
                localField:'_id',
                foreignField:'subcriber',
                as:'subscribedTo'
            }
        },
        {
            $addFields:{
                totalSubscribers:{
                    $size: '$subscribers'
                },
                totalSubscribedChannels:{
                    $size: '$subscribedTo'
                },
                isYouSubscribed:{
                    $cond:{
                        if:{
                            $in:[
                                req.user?._id,
                                '$subscribers.subcriber'
                            ]
                        },
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                username:1,
                fullName:1,
                email:1,
                avatar:1,
                coverImage:1,
                totalSubscribedChannels:1,
                totalSubscribers:1,
                isYouSubscribed:1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404,'Channel doesnt exist')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            channel[0],
            "user channel fetched"
        )
    )

})

const getWatchHistory = asyncHandler( async (req,res) =>{
    const user = await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:'videos',
                localField:'watchHistory',
                foreignField:'_id',
                as:'watchHistory',
                pipeline:[
                    {
                        $lookup:{
                            from:'users',
                            localField:'owner',
                            foreignField:'_id',
                            as:'owner',
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: '$owner'
                            }
                        }
                    }                    
                ]
            }
        },
        {
            $project:{
                watchHistory:1
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0],
            'Watch History fetched successfully'
        )
    )

})

export { registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}