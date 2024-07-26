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
import healthcheckRouter from "./routes/healthcheck.route.js"
import tweetRouter from "./routes/tweet.route.js"
import subscriptionRouter from "./routes/subscription.route.js"
import videoRouter from "./routes/video.route.js"
import commentRouter from "./routes/comment.route.js"
import likeRouter from "./routes/like.route.js"
import playlistRouter from "./routes/playlist.route.js"
import dashboardRouter from "./routes/dashboard.route.js"

//routes declaration
app.use("/api/v1/healthcheck", healthcheckRouter) // DOne
app.use("/api/v1/users", userRouter) // DOne
app.use("/api/v1/tweets", tweetRouter) // DOne
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter) // DOne
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter) // DOne
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)

export {app}