import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    
    const {content} = req.body
    
    if(!content?.trim()){
        throw new ApiError(404, 'Content of tweet is required')
    }

    const tweet = await Tweet.insertMany([
        {
            content,
            owner:req.user?._id
        }
    ])

    if(!tweet){
        throw new ApiError(500, 'Something went wrong while adding tweet')
    }

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            tweet,
            'Successfully added a tweet'
        )
    )

})

const getUserTweets = asyncHandler(async (req, res) => {
    
    const {userId} = req.params 
    if(!isValidObjectId(userId)){
        throw new ApiError(404, 'user id is required and should be valid')
    }

    const allTweets = await Tweet.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:'users',
                localField:'owner',
                foreignField:'_id',
                as:'owner',
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullName:1
                        }
                    }
                ]
            }
        },
        {
            $unwind:'$owner'
        }
    ])

    if(!allTweets){
        throw new ApiError(500, 'Something went wrong while fetching the tweets of the user')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            allTweets,
            'Successfully fetched all the tweets'
        )
    )

})

const updateTweet = asyncHandler(async (req, res) => {
    
    const {content} = req.body
    const {tweetId} = req.params
    
    if(!content?.trim()){
        throw new ApiError(404, 'Content of tweet is required')
    }
    if(!isValidObjectId(tweetId)){
        throw new ApiError(404, 'tweet id is required and should be valid')
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet || tweet.owner != req.user?._id){
        throw new ApiError(401, 'Either tweet doesn`t exist or trying to update some other user`s tweet')
    }
    
    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content
            }
        },
        {new:true}
    )

    if(!tweet){
        throw new ApiError(500, 'Something went wrong while updating tweet')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedTweet,
            'Successfully updated a tweet'
        )
    )

})

const deleteTweet = asyncHandler(async (req, res) => {
    
    const {tweetId} = req.params
    
    if(!isValidObjectId(tweetId)){
        throw new ApiError(404, 'tweet id is required and should be valid')
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet || tweet.owner != req.user?._id){
        throw new ApiError(401, 'Either tweet doesn`t exist or trying to delete some other user`s tweet')
    }

    const deletedTweet = await Tweet.deleteOne({_id:tweetId})

    if(!deletedTweet){
        throw new ApiError(500,'Something went wrong while deleting the tweet')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            deletedTweet,
            'Successfully deleted a tweet'
        )
    )

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
