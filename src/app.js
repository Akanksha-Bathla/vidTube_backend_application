import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

const app = express()

//middleware to state who all can access our backend 
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true
    })
)

//common middleware
app.use(express.json({limit: "16kb"})) 
app.use(express.urlencoded({ extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// import routes
import healthcheckRouter from "./routes/healthcheck.route.js"
import userRouter from "./routes/user.route.js"
import videoRouter from "./routes/video.route.js"

//routes
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/videos", videoRouter)

export {app};