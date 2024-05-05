import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

export const connectDB = async ()=>{
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`DB connected successfully with instance: ${connectionInstance}`);
    }
    catch(err){
        console.log("DB_CONN_ERR = ", err);
    }
}