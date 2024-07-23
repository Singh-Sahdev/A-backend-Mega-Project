import mongoose from "mongoose"
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { ApiError } from "../utils/ApiError.js"

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        lowercase:true,
        unique:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        lowercase:true,
        unique:true,
        trim:true,
    },
    fullName:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        publicId:{
            type:String,
            required:true
        },
        url:{
            type:String, //url of 3rd party service for file storing
            required:true,
        }
    },
    coverImage:{
        publicId:{
            type:String
        },
        url:{
            type:String, //url of 3rd party service for file storing
        }
    },
    watchHistory:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'Video'
        }
    ],
    password:{
        type:String,
        required:[true,'Password is required']

    },
    refreshToken:{
        type: String
    },
    isActive:{
        type:Boolean,
        default:true
    }

},{timestamps:true})

userSchema.pre('save', async function(next){
    if(!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password,10)
    next()
})

userSchema.post('deleteOne',{document:true,query:false},async function(next){
    try {
        const deletedAvatar = await deleteFromCloudinary(this.avatar?.publicId,'image')
        if(this.coverImage){
            const deletedCoverImage = await deleteFromCloudinary(this.coverImage?.publicId,'image')
        }
        await this.model("Video").deleteMany({owner:this._id})
        await this.model('Comment').deleteMany({owner:this._id})
        await this.model('Like').deleteMany({likedBy:this._id})
        await this.model('Subscription').deleteMany({$or:[{subscriber:req.user?._id},{channel:req.user?._id}]})
        await this.model('Tweet').deleteMany({owner:req.user?._id})
        await this.model('Playlist').deleteMany({owner:req.user?._id})
            
    } catch (error) {
        throw new ApiError(500, 'Something went wrong in post middleware in deleting user')
    }
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id : this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY,
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id : this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY,
        }
    )
}

export const User = mongoose.model('User',userSchema)