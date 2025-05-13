import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
    path:"./.env"
})

const PORT = process.env.PORT || 8001


connectDB()
.then(()=>{
    app.listen(8000,()=>{
        console.log(`Server is running on port ${PORT}`)
    })
})
.catch((err) => {
    console.log("Mongodb connection error", err)
})
