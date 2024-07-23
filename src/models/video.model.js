import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { ApiError } from "../utils/ApiError.js";

const videoSchema = new mongoose.Schema({
    videoFile:{
        publicId:{
            type:String, 
            required:true
        },
        url:{
            type:String, // url
            required:true
        }
    },
    thumbnail:{
        publicId:{
            type:String,
            required:true
        },
        url:{
            type:String,
            required:true
        }
    },
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    duration:{
        type:Number, 
        required:true
    },
    views:{
        type:Number,
        default:0
    },
    likes:{
        type:Number,
        default:0
    },
    isPublished:{
        type:Boolean,
        default:true
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    isActive:{
        type:Boolean,
        default:true
    }
},{timestamps:true})

videoSchema.plugin(mongooseAggregatePaginate) // for using complex aggregation queries on mongoDB

videoSchema.pre('save',async function(next){
    try {
        if(this.isModified('videoFile')){
            const deleteVideo = await deleteFromCloudinary(this.videoFile?.publicId,'video')
        }
        if(this.isModified('thumbnail')){
            const deleteThumbnail = await deleteFromCloudinary(this.thumbnail?.publicId,'image')
        }
        if(!this.isActive){
            const deletedVideo = await deleteFromCloudinary(this.videoFile?.publicId,'video')
            const deldetedThumbnail = await deleteFromCloudinary(this.thumbnail?.publicId,'image')
        }
        next()
    }
    catch(error){
        throw new ApiError(500,'Something Went wrong while deleting the video')
    }
})

// videoSchema.post('deleteOne',{document:true,query:false},async function(next){
//     try {
//         const deletedVideo = await deleteFromCloudinary(this.videoFile?.publicId,'video')
//         const deldetedThumbnail = await deleteFromCloudinary(this.thumbnail?.publicId,'image')
//         // await this.model('Comment').deleteMany({video:this._id})
//         // await this.model('Like').deleteMany({video:this._id})
            
//     } catch (error) {
//         throw new ApiError(500, 'Something went wrong in post middleware in deleting video')
//     }
// })

export const Video = mongoose.model('Video',videoSchema)