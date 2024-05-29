import mongoose from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {

    const {videoId} = req.params

    if(!videoId){
        throw new ApiError(404, 'Video Id is required')
    }

    const likedVideo = await Like.findOne({
        video:videoId,
        likedBy:req.user?._id
    })

    if(likedVideo){
        const unLike = await Like.deleteOne({
            video:videoId,
            likedBy:req.user?._id
        })

        if(!unLike){
            throw new ApiError(500, 'Something went wrong while unliking the video')
        }
    }
    else{
        const like = await Like.insertMany([{
            video:videoId,
            likedBy:req.user?._id
        }])

        if(!like){
            throw new ApiError(500, 'Something went wrong while unliking the video')
        }
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,{},'Successfully toggled the video like button'
        )
    )

})

const toggleCommentLike = asyncHandler(async (req, res) => {

    const {commentId} = req.params

    if(!commentId){
        throw new ApiError(404, 'comment Id is required')
    }

    const likedComment = await Like.findOne({
        comment:commentId,
        likedBy:req.user?._id
    })

    if(likedComment){
        const unLike = await Like.deleteOne({
            comment:commentId,
            likedBy:req.user?._id
        })

        if(!unLike){
            throw new ApiError(500, 'Something went wrong while unliking the comment')
        }
    }
    else{
        const like = await Like.insertMany([{
            comment:commentId,
            likedBy:req.user?._id
        }])

        if(!like){
            throw new ApiError(500, 'Something went wrong while unliking the comment')
        }
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,{},'Successfully toggled the comment like button'
        )
    )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    if(!tweetId){
        throw new ApiError(404, 'tweet Id is required')
    }

    const likedTweet = await Like.findOne({
        tweet:tweetId,
        likedBy:req.user?._id
    })

    if(likedTweet){
        const unLike = await Like.deleteOne({
            tweet:tweetId,
            likedBy:req.user?._id
        })

        if(!unLike){
            throw new ApiError(500, 'Something went wrong while unliking the tweet')
        }
    }
    else{
        const like = await Like.insertMany([{
            tweet:tweetId,
            likedBy:req.user?._id
        }])

        if(!like){
            throw new ApiError(500, 'Something went wrong while unliking the tweet')
        }
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,{},'Successfully toggled the tweet like button'
        )
    )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    
    await Like.aggregate([
        {
            $match:{
                $and:[
                    {
                        likedBy:new mongoose.Types.ObjectId(req.user?._id)
                    },
                    {
                        video:{
                            $exists:true
                        }
                    }
                ]

            }
        },
        {
            $lookup:{
                from:'videos',
                localField:'video',
                foreignField:'_id',
                as:'Videos',
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
                                        username:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $project:{
                            duration:1,
                            thumbnail:1,
                            owner:1,
                            isPublished:1,
                            title:1,
                            views:1,
                            isPublished:1
                        }
                    }
                ]
            }
        }
    ])

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}