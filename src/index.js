import { connectDB } from "./db/index.js";
import dotenv from "dotenv";
dotenv.config({path:'./.env'})

connectDB()

/*
(async ()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    }
    catch(err){
        console.log("DB_CONN_ERR = ", err);
    }
})()
*/