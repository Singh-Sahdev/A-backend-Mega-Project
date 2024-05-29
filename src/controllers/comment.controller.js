import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params // expecting username of user in params
    const {page = 1, limit = 10} = req.query

    const options = {
        page,
        limit
    }

    const commentAggregate = Comment.aggregate([
        {
            $match:{
                video:new mongoose.Types.ObjectId(`${videoId}`)
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
        }
    ])

    let allComments=null;
    await Comment.aggregatePaginate(commentAggregate,options,(err,result)=>{
        if(!err){
            allComments = result.docs
        }
        else {
            throw new ApiError(500,'Something went wrong while fetching the comments')
        }
        
    })


    if(!allComments){
        throw new ApiError(500,'Something went wrong while fetching the comments')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            allComments,
            'Successfully fetched all the comments'
        )
    )

})

const addComment = asyncHandler(async (req, res) => {

    const {videoId} = req.params 
    const {comment} = req.body

    if(!videoId){
        throw new ApiError(404,'video id is required ')
    }
    if(!comment){
        throw new ApiError(404,'comment is required ')
    }

    const addedComment = await Comment.insertMany([
        {
            comment,
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

    if(!commentId){
        throw new ApiError(404,'comment id is required ')
    }
    if(!content){
        throw new ApiError(404,'comment is required ')
    }

    const comment = await Comment.findById(commentId);

    if(!comment || comment.owner!=req.user?._id){
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
            'Successfully deleted comment'
        )
    )


})

const deleteComment = asyncHandler(async (req, res) => {
    
    const {commentId} = req.params
     

    if(!commentId){
        throw new ApiError(404,'comment id is required ')
    }

    const comment = await Comment.findById(commentId);

    if(!comment || comment.owner!=req.user?._id){
        throw new ApiError(401,`Either comment id is invalid or trying to delete other user's comment`)
    }
    
    const deletedComment = await Comment.findByIdAndDelete(commentId)

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