import mongoose from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!channelId){
        throw new ApiError(404,'Channel id is required')
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

    if(!channelId){
        throw new ApiError(404,'Channel id is required')
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
                as:'subscriberInfo'
            }
        },
        {
            $unwind:'$subsciberInfo'
        },
        {
            $project:{
                username:'$subsriberInfo.username',
                fullName:'$subsriberInfo.fullName',
                avatar:'$subsriberInfo.avatar',
                email:'$subsriberInfo.email'
            }
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

    if(!subscriberId){
        throw new ApiError(404,'user id is required')
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
                as:'channelInfo'
            }
        },
        {
            $unwind:'$channelInfo'
        },
        {
            $project:{
                username:'$channelInfo.username',
                fullName:'$channelInfo.fullName',
                avatar:'$channelInfo.avatar',
                email:'$channelInfo.email'
            }
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