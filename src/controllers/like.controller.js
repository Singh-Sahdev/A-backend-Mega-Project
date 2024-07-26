import mongoose,{isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Tweet } from "../models/tweet.model.js"
import {Comment} from '../models/comment.model.js'
import {Video} from '../models/video.model.js'

const toggleVideoLike = asyncHandler(async (req, res) => {

    const {videoId} = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(404, 'video id is required and should be valid')
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

        const video = await Video.findById(videoId)
        video.likes-=1
        await video.save({validateBeforeSave:false})

    }
    else{
        const like = await Like.create({
            video:videoId,
            likedBy:req.user?._id
        })

        if(!like){
            throw new ApiError(500, 'Something went wrong while unliking the video')
        }

        const video = await Video.findById(videoId)
        video.likes+=1
        await video.save({validateBeforeSave:false})

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

    if(!isValidObjectId(commentId)){
        throw new ApiError(404, 'comment id is required and should be valid')
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

        const comment = await Comment.findById(commentId)
        comment.likes-=1
        await comment.save({validateBeforeSave:false})

    }
    else{
        const like = await Like.create({
            comment:commentId,
            likedBy:req.user?._id
        })

        if(!like){
            throw new ApiError(500, 'Something went wrong while unliking the comment')
        }
        const comment = await Comment.findById(commentId)
        comment.likes+=1
        await comment.save({validateBeforeSave:false})
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

    if(!isValidObjectId(tweetId)){
        throw new ApiError(404, 'tweet id is required and should be valid')
    }

    const likedTweet = await Like.findOne({
        tweet:tweetId
    })

    if(likedTweet){
        const unLike = await Like.deleteOne({
            tweet:tweetId
        })


        if(!unLike){
            throw new ApiError(500, 'Something went wrong while unliking the tweet')
        }

        const tweet = await Tweet.findById(tweetId)
        tweet.likes-=1
        await tweet.save({validateBeforeSave:false})

    }
    else{
        const like = await Like.create({
            tweet:tweetId,
            likedBy:req.user?._id
        })

        if(!like){
            throw new ApiError(500, 'Something went wrong while unliking the tweet')
        }
        const tweet = await Tweet.findById(tweetId)
        tweet.likes+=1
        await tweet.save({validateBeforeSave:false})
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
    let likedVideos = []
    try {
        likedVideos = await Like.aggregate([
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
                    as:'video',
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
                            $unwind:'$owner'
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
            },
            {
                $unwind:'$video'
            }
        ])

        
    } catch (error) {
        throw new ApiError(500, 'Something went wrong while fetching liked videos')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            likedVideos,
            'Successfully fetched the liked videos'
        )
    )

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}