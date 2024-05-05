import { connectDB } from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config({path:'./.env'})

connectDB()
.then(()=>{
    app.on('error',(error)=>{
        console.log(`App connection failed = ${error}`);
    })
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`App listening on port ${process.env.PORT || 8000}`);
    })
})
.catch((err)=>{
    console.log(`mongo db connection error = ${err}`);
})
