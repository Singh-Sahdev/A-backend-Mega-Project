import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary,deleteFromCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    let { page = 1, limit = 10, query, sortBy='title', sortType = 'ascending'} = req.query

    page = parseInt(page)
    limit = parseInt(limit)

    sortType = sortType === "ascending" ? 1 : -1

    const videos = await Video.aggregate([
        {
            $match:{
                title:query
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
                            fullName:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $unwind:'$owner'
        },
        {
            $skip:(page-1)*limit
        },
        {
            $limit:limit
        },
        {
            $sort:{
                [sortBy]:sortType
            }
        }
    ])

    if(!videos){
        throw new ApiError(500,'Something went wrong while fetching the videos')
    }

    const totalVideos = videos.length
    const totalPages = Math.ceil(totalVideos/limit)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {videos,totalVideos,totalPages},
            'Successfully fetched all the videos'
        )
    )

})

const publishAVideo = asyncHandler(async (req, res) => {

    const { title, description} = req.body

    if(
        [title,description].some( item => item?.trim() === '')
    ){
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
        url:video.url,
        publicId:video.public_id
    }

    const newThumbnail = {
        publicId: thumbnail.public_id,
        url:thumbnail.url
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
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(404,'Invalid video id')
    }

    const video = await Video.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(videoId)
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
                            fullName:1,
                            avatar:1
                        }
                    }
                ]
            }
        }
    ])
    
    if(!video){
        throw new ApiError(500,'Something went wrong while fetching video by id')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            'Successfully fetched video by id'
        )
    )

})

const updateVideo = asyncHandler(async (req, res) => {

    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(404, 'Invalid video Id')
    }

    const {title,description} = req.body

    let videoLocalPath = null
    let thumbnailLocalPath = null

    if('video' in req.files && req.files.video.length ){
        videoLocalPath = req.files.video[0].path
    }

    if('thumbnail' in req.files && req.files.thumbnail.length ){
        thumbnailLocalPath = req.files.thumbnail[0].path
    }

    if(
        [title,description,videoLocalPath,thumbnailLocalPath].every( it => !it?.trim())
    ){
        throw new ApiError(404,'Atleast 1 field is required')
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(500,'Something went wrong while updating the video')
    }

    
    if(videoLocalPath){
        const uploadVideo = await uploadOnCloudinary(videoLocalPath)
        if(!uploadVideo){
            throw new ApiError(500, 'Something went wrong while uploading the video ')
        }
        video.videoFile.url = uploadVideo.url
        video.videoFile.publicId = uploadVideo.public_id

    }

    if(thumbnailLocalPath){
        const uploadThumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        if(!uploadThumbnail){
            throw new ApiError(500, 'Something went wrong while uploading the thumbnail ')
        }
        video.thumbnail.url = uploadThumbnail.url
        video.thumbnail.publicId = uploadThumbnail.public_id
        
    }

    if(title){
        video.title = title
    }
    if(description){
        video.description = description
    }

    await video.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            'Successfully updated the video'
        )
    )

})

const deleteVideo = asyncHandler(async (req, res) => {

    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(404, 'Invalid video Id')
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId)

    if(!deletedVideo){
        throw new ApiError(500,'Something went wrong while deleting the video')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            deletedVideo,
            'Successfully deleted video'
        )
    )

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(404, 'Invalid video Id')
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(500,'Something went wrong while updating the video')
    }

    video.isPublished = !video.isPublished

    await video.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            'Successfully toggled isPublished status of the video'
        )
    )

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
