import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema({
    videoFile:{
        videoFilePublicId:{
            type:String, 
            required:true
        },
        videoFileUrl:{
            type:String, // url
            required:true
        }
    },
    thumbnail:{
        thumbnailPublicId:{
            type:String,
            required:true
        },
        thumbnailUrl:{
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
    isPublished:{
        type:Boolean,
        default:true
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    }
},{timestamps:true})

videoSchema.plugin(mongooseAggregatePaginate) // for using complex aggregation queries on mongoDB

export const Video = mongoose.model('Video',videoSchema)