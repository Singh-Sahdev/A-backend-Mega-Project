import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

// for cross origin requests to our server
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

//for setting json request limit
app.use(express.json({limit:'16kb'}))

//for handling different url request encodings
app.use(express.urlencoded({extended:true, limit: "16kb"}))

//for storing temporary or public assets for our server
app.use(express.static('public'))

// for managing web browser cookies
app.use(cookieParser())


// Importing Routes
import userRouter from './routes/user.route.js'
import videoRouter from './routes/video.routes.js'

app.use('/api/v1/users',userRouter)
app.use('/api/v1/videos',videoRouter)

export {app}