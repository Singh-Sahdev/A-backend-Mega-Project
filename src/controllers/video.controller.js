import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {

    const { title, description} = req.body

    if(!title || !description){
        throw new ApiError(404,'both title and description is required')
    }

    let videoLocalPath = null
    let thumbnailLocalPath = null

    if('video' in req.files && req.files.video.length ){
        videoLocalPath = req.files.video[0].path
    }

    if('thumbnail' in req.files && req.files.thumbnail.length ){
        thumbnailLocalPath = req.files.thumbnail[0].path
    }

    const video = await uploadOnCloudinary(videoLocalPath);

    if(!video){
        throw new ApiError(500, 'Something went wrong while publishing the video ')
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if(!thumbnail){
        throw new ApiError(500, 'Something went wrong while uploading the thumbnail ')
    }

    const newVideoFile = {
        videoFileUrl:video.url,
        videoFilePublicId:video.public_id
    }

    const newThumbnail = {
        thumbnailPublicId: thumbnail.public_id,
        thumbnailUrl:thumbnail.url
    }

    const publishedVideo = await Video.insertMany([
        {
            title,
            description,
            views:0,
            isPublished:true,
            thumbnail:newThumbnail,
            videoFile:newVideoFile,
            duration:video.duration,
            owner:req.user?._id
        }
    ])

    if(!publishedVideo){
        const deletedVideo = await deleteFromCloudinary(video.public_id,'video')
        const deldetedThumbnail = await deleteFromCloudinary(thumbnail.public_id,'image')
        throw new ApiError(500, 'Something went wrong while publishing the video in db ')
    }
    
    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            publishedVideo,
            'Successfully published a video'
        )
    )

    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
