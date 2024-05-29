import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {

    const {name, description} = req.body

    if(!name){
        throw new ApiError(404, 'playlist name is required')
    }
    description = description?description:''

    const playlist = await Playlist.insertMany([{
        videos:[],
        name,
        description,
        owner:req.user?._id
    }])

    if(!playlist){
        throw new ApiError(500,'Something went wrong while creating playlist')
    }

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            playlist,
            'Successfully created a empty playlist'
        )
    )

})

const getUserPlaylists = asyncHandler(async (req, res) => {

    const {userId} = req.params

    if(!userId){
        throw new ApiError(404,'UserId is required for fetching playlists')
    }

    const allPlaylists = await Playlist.aggregate([
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
        },
        {
            $project:{
                video:0,
                description:0
            }
        }
    ])

    if(!allPlaylists){
        throw new ApiError(500, 'Something went wrong while fetching all playlists')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            allPlaylists,
            'Successfully fetched all playlists of the given user'
        )
    )

})

const getPlaylistById = asyncHandler(async (req, res) => {

    const {playlistId} = req.params

    if(!playlistId || !isValidObjectId(playlistId)){
        throw new ApiError(404, 'playlistId is required and should be valid ')
    }

    const playlist = await Playlist.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(playlistId)
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
                            title:1,
                            thumbnail:1,
                            duration:1,
                            videoFile:1,
                            owner:1,
                            views:1,
                            isPublished:1
                        }
                    }
                ]
            }
        }
        
    ])

    if(!playlist){
        throw new ApiError(500, 'Something went wrong while fetching the playlist from id')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist[0],
            'Successfully fetched the playlist from id'
        )
    )

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {

    const {playlistId, videoId} = req.params

    if(!playlistId || !videoId || !isValidObjectId(videoId) || !isValidObjectId(playlistId)){
        throw new ApiError(404, 'both playlist id and video id are required and should be valid ')
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(500, 'Something went wrong while fetching the playlist')
    }

    try {
        playlist?.video.push(videoId)
        await playlist?.save({validateBeforeSave:false})
    } catch (error) {
        throw new ApiError(500, 'Something went wrong while adding video to playlist')
    }

    return res
    .status(200)
    .json(
        200,
        playlist,
        'Successfully added the video to playlist'
    )


})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!playlistId || !videoId || !isValidObjectId(videoId) || !isValidObjectId(playlistId)){
        throw new ApiError(404, 'both playlist id and video id are required and should be valid ')
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(500, 'Something went wrong while fetching the playlist')
    }

    try {
        playlist?.video = playlist?.video.filter( id => id!=videoId)
        await playlist?.save({validateBeforeSave:false})
    } catch (error) {
        throw new ApiError(500, 'Something went wrong while removing video from playlist')
    }

    return res
    .status(200)
    .json(
        200,
        playlist,
        'Successfully removed the video from playlist'
    )


})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if(!playlistId || !isValidObjectId(playlistId)){
        throw new ApiError(404, 'playlistId is required and should be valid ')
    }

    try {
        await Playlist.findByIdAndDelete(playlistId)
    } catch (error) {
        throw new ApiError(500, 'Something went wrong while deleting the playlist')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            'SUccessfully deleted the playlist'
        )
    )

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if(!playlistId || !isValidObjectId(playlistId)){
        throw new ApiError(404, 'playlistId is required and should be valid ')
    }

    if(!name && !description){
        throw new ApiError(404, 'either name or description is required')
    }

    const playlist = await Playlist.findById(playlistId)
    playlist?.name = name?name:playlist?.name
    playlist?.description = description?description:playlist?.description

    try {
        await playlist.save({validateBeforeSave:false})
    } catch (error) {
        throw new ApiError(500, 'Something went wrong while updating the playlist')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            'Successfully updated the playlist'
        )
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
