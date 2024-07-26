import mongoose from "mongoose";

const tweetSchema = new mongoose.Schema(
    {
        content:{
            type:String,
            required:true
        },
        owner:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        },
        likes:{
            type:Number,
            default:0
        },
        isActive:{
            type:Boolean,
            default:true
        }
    },
    {timestamps:true}
)

export const Tweet = mongoose.model('Tweet',tweetSchema)