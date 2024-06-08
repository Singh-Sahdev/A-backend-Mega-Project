import mongoose,{isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
        throw new ApiError(404, 'channel id is required and should be valid')
    }

    // check whether user has subscribed or not
    try {
        const isSubscribed = await Subscription.findOne({
            $and:[
                {
                    subscriber:req.user?._id
                },
                {
                    channel:channelId
                }
            ]
        })
    
        if(isSubscribed){
            const unsubscribed = await Subscription.deleteOne({
                _id:isSubscribed._id
            })
    
            if(!unsubscribed){
                throw new ApiError(500, 'Something went wrong while unsubscribing the channel')
            }
        }
        else {
            const subscribed = await Subscription.insertMany([
                {
                    channel:channelId,
                    subscriber:req.user?._id
                }
            ])
    
            if(!subscribed){
                throw new ApiError(500, 'Something went wrong while subscribing the channel')
            }
        }
    } catch (error) {
        throw new ApiError(500, 'Something went wrong while toggling subscription')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            'Successfully toggled the subscription'
        )
    )

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
        throw new ApiError(404, 'channel id is required and should be valid')
    }

    const listOfSubscribers = await Subscription.aggregate([
        {
            $match:{
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from:'users',
                localField:'subscriber',
                foreignField:'_id',
                as:'subscriberInfo',
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullName:1,
                            avatar:1,
                            email:1
                        }
                    }
                ]
            }
        },
        {
            $unwind:'$subscriberInfo'
        }
    ])

    if(!listOfSubscribers){
        throw new ApiError(500,'Something went wrong while fetching list of subscribers')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            listOfSubscribers,
            'Successfully fetched the list of all subscibers'
        )
    )

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(404, 'subscriber id is required and should be valid')
    }

    const listOfChannels = await Subscription.aggregate([
        {
            $match:{
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from:'users',
                localField:'channel',
                foreignField:'_id',
                as:'channelInfo',
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullName:1,
                            avatar:1,
                            email:1
                        }
                    }
                ]
            }
        },
        {
            $unwind:'$channelInfo'
        }
    ])

    if(!listOfChannels){
        throw new ApiError(500,'Something went wrong while fetching list of Channels')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            listOfChannels,
            'Successfully fetched the list of all subscibers'
        )
    )    

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}