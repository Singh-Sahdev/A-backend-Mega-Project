import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema(
    {
        video:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:'Video'
            }
        ],
        name:{
            type:String,
            required:true
        },
        descriptiojm:{
            type:String
        },
        owner:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        },
    },
    {
        timestamps:true
    }
)

export const Playlist = mongoose.model('Playlist',playlistSchema)