import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {

    const {videoId} = req.params 
    let {page = 1, limit = 10} = req.query
    page = parseInt(page)
    limit = parseInt(limit)

    if(!isValidObjectId(videoId)){
        throw new ApiError(404, 'video id is required and should be valid')
    }

    const allComments = await Comment.aggregate([
        {
            $match:{
                video:new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from:'users',
                localField:'owner',
                foreignField:'_id',
                as:'comments',
                pipeline:[
                    {
                        $project:{
                            username:1,
                            avatar:1,
                            fullName:1
                        }
                    }
                ]
            }
        },
        {
            $skip:(page-1)*limit
        },
        {
            $limit:limit
        }
    ])

    if(!allComments){
        throw new ApiError(500,'Something went wrong while fetching the comments')
    }

    const totalComments = allComments.length
    const totalPages = Math.ceil(totalComments/limit)
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {allComments,totalComments,totalPages},
            'Successfully fetched all the comments'
        )
    )

})

const addComment = asyncHandler(async (req, res) => {

    const {videoId} = req.params 
    const {content} = req.body

    if(!isValidObjectId(videoId)){
        throw new ApiError(404, 'video id is required and should be valid')
    }
    if(!content?.trim()){
        throw new ApiError(404,'comment is required ')
    }

    const addedComment = await Comment.insertMany([
        {
            content,
            owner:req.user?._id,
            video:videoId
        }
    ])

    if(!addedComment){
        throw new ApiError(500, 'something went wrong while adding new comment')
    }

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            addedComment,
            'successfully added new comment'
        )
    )

})

const updateComment = asyncHandler(async (req, res) => {

    const {commentId} = req.params 
    const {content} = req.body
    

    if(!isValidObjectId(commentId)){
        throw new ApiError(404, 'comment id is required and should be valid')
    }
    if(!content?.trim()){
        throw new ApiError(404,'comment is required ')
    }

    const comment = await Comment.findById(commentId);

    if(!comment || !comment.owner.equals(req.user?._id)){
        throw new ApiError(401,'Either comment id is invalid or trying to update other user comment')
    }
    
    comment.content = content
    await comment.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            comment,
            'Successfully updated the comment'
        )
    )


})

const deleteComment = asyncHandler(async (req, res) => {
    
    const {commentId} = req.params
     

    if(!isValidObjectId(commentId)){
        throw new ApiError(404, 'comment id is required and should be valid')
    }

    const comment = await Comment.findById(commentId);

    if(!comment || !comment.owner.equals(req.user?._id)){
        throw new ApiError(401,`Either comment id is invalid or trying to delete other user's comment`)
    }
    
    const deletedComment = await Comment.findByIdAndUpdate(commentId,
        {
            isActive : false
        },
        {new:true}
    )

    if(!deletedComment){
        throw new ApiError(500,'something went wrong while deleting comment')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            'Successfully deleted comment'
        )
    )

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }
