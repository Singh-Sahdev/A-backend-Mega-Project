import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {

    const channelStats={
        totalViews:0,
        totalSubscribers:0,
        totalVideos:0,
        totalLikes:{
            totalVideoLikes:0,
            totalCommentLikes:0,
            totalTweetLikes:0
        },
        totalComments:0
    }

    // fetching total views
    const getViews = await Video.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $group:{
                _id:null,
                views:{
                    $sum:'$views'
                }
            }
        },
        {
            $project:{
                _id:0,
                views:1
            }
        }
    ])

    if(!getViews){
        throw new ApiError(500, ' Something went wrong while fetching total views ')
    }
    else{
        channelStats.totalLikes = getViews[0].views
    }

    // fetching total subscribers
    const getSubscribers = await Subscription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $group:{
                _id:null,
                subscribers:{
                    $sum:1
                }
            }
        },
        {
            $project:{
                _id:0,
                subscibers:1
            }
        }
    ])

    if(!getSubscribers){
        throw new ApiError(500, ' Something went wrong while fetching total subscribers ')
    }
    else{
        channelStats.totalSubscribers = getSubscribers[0].subscibers
    }

    // fetching total videos
    const getVideos = await Video.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $group:{
                _id:null,
                videos:{
                    $sum:1
                }
            }
        },
        {
            $project:{
                _id:0,
                videos:1
            }
        }
    ])

    if(!getVideos){
        throw new ApiError(500, ' Something went wrong while fetching total Videos ')
    }
    else{
        channelStats.totalVideos = getVideos[0].videos
    }

    // fetching total videos likes

    const getVideoLikes = await Like.aggregate([
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
            $group:{
                _id:null,
                videoLikes:{
                    $sum:1
                }
            }
        },
        {
            $project:{
                _id:0,
                videoLikes:1
            }
        }
    ])

    if(!getVideoLikes){
        throw new ApiError(500, 'Something went wrong while fetching total video likes')
    }
    else{
        channelStats.totalLikes.totalVideoLikes = getVideoLikes[0].videoLikes
    }

    const getTweetLikes = await Like.aggregate([
        {
            $match:{
                $and:[
                    {
                        likedBy:new mongoose.Types.ObjectId(req.user?._id)
                    },
                    {
                        tweet:{
                            $exists:true
                        }
                    }
                ]
            }
        },
        {
            $group:{
                _id:null,
                tweetLikes:{
                    $sum:1
                }
            }
        },
        {
            $project:{
                _id:0,
                tweetLikes:1
            }
        }
    ])

    if(!getTweetLikes){
        throw new ApiError(500, 'Something went wrong while fetching total tweet likes')
    }
    else{
        channelStats.totalLikes.totalTweetLikes = getTweetLikes[0].tweetLikes
    }

    const getCommentLikes = await Like.aggregate([
        {
            $match:{
                $and:[
                    {
                        likedBy:new mongoose.Types.ObjectId(req.user?._id)
                    },
                    {
                        comment:{
                            $exists:true
                        }
                    }
                ]
            }
        },
        {
            $group:{
                _id:null,
                commentLikes:{
                    $sum:1
                }
            }
        },
        {
            $project:{
                _id:0,
                commentLikes:1
            }
        }
    ])

    if(!getCommentLikes){
        throw new ApiError(500, 'Something went wrong while fetching total comment likes')
    }
    else{
        channelStats.totalLikes.totalCommentLikes = getCommentLikes[0].commentLikes
    }

    const getComment = await Video.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:'comments',
                localField:'_id',
                foreignField:'video',
                as:'comments'
            }
        },
        {
            $unwind:'$comments'
        },
        {
            $group:{
                _id:null,
                comments:{
                    $sum:1
                }
            }
        },
        {
            $project:{
                _id:0,
                comments:1
            }
        }
    ])

    if(!getComment){
        throw new ApiError(500, 'Something went wrong while fetching total comments')
    }
    else{
        channelStats.totalComments = getComment[0].comments
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            channelStats,
            'Successfully fetched the channel stats'
        )
    )

})

const getChannelVideos = asyncHandler(async (req, res) => {

    let {page = 1, limit = 10} = req.body
    
    page = parseInt(page)
    limit = parseInt(limit)

    let allVideos=[]

    try {
        allVideos = await Video.aggregate([
            {
                $match:{
                    owner:new mongoose.Types.ObjectId(req.user?._id)
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
            },
            {
                $project:{
                    videoFile:1,
                    title:1,
                    thumbnail:1,
                    duration:1,
                    views:1,
                    isPublished:1,
                    owner:1,
    
                }
            },
            {
                $skip:(page-1)*limit
            },
            {
                $limit:limit
            }
        ])
    } catch (error) {
        throw new ApiError(500, 'Something went wrong while fetching all videos ')
    }

    const totalVideos = allVideos?.length || 0
    const totalPages = Math.ceil(totalVideos/limit)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {allVideos,totalVideos,totalPages},
            `Successfully fetched all videos of page no. ${page}`
        )
    )
    
})

export {
    getChannelStats, 
    getChannelVideos
    }