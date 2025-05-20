import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken";


const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        //small check for user existence
    
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
    
        user.refreshToken = refreshToken
        await user.save({validationBeforeSave: false})
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens.")
    }
}


const registerUser = asyncHandler( async (req, res)=>{
    const { fullname, email, username, password } = req.body

    //validation
    if([fullname, email, username, password].some((field)=>field?.trim() === "")){
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if(existedUser) {
        throw new ApiError(409, "Usre with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path
    const coverLocalPath = req.files?.coverImage?.[0]?.path
    console.warn(coverLocalPath)

    if (!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing.")
    }

    // const avatar = await uploadOnCloudinary(avatarLocalPath)
    // let coverImage = ""
    // if (coverLocalPath) {
    //     coverImage = await uploadOnCloudinary(coverLocalPath)
    // }
    let avatar;
    try {
        avatar = await uploadOnCloudinary(avatarLocalPath)
        console.log("Uploaded avatar", avatar)
    } catch (error) {
        console.log("Error uploading avatar", error)
        throw new ApiError(500, "Failed to upload avatar")
    }

    let coverImage = { url: "" };

    if (coverLocalPath) {
        try {
            coverImage = await uploadOnCloudinary(coverLocalPath);
            console.log("Uploaded coverImage", coverImage);
        } catch (error) {
            console.log("Error uploading coverImage", error);
            throw new ApiError(500, "Failed to upload coverImage");
        }
    }

    try {
        const user = await User.create({
            fullname,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
        })
    
        const createdUser = await User.findById(user._id).select("-password -refreshToken")
    
        if(!createdUser) {
            throw new ApiError(500, "Something went wrong while registering the user.")
        }
    
        return res
            .status(201)
            .json(new ApiResponse(201, createdUser, "User registered Successfully."))
    } catch (error) {
        console.log("User Creation failed")

        if (avatar){
            await deleteFromCloudinary(avatar.public_id)
        }
        if (coverImage) {
            await deleteFromCloudinary(coverImage.public_id)
        }

        throw new ApiError(500, "Something went wrong while registering the user and images were deleted.")
    }
})


const loginUser = asyncHandler(async (req, res) => {
    //get data from body
    const {email, username, password} = req.body

    //validation
    if(!email){
        throw new ApiError(400, "Email is required.")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User not found.")
    }

    // validate Password

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid credentials.")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id)
        .select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(
            200,
            { user: loggedInUser, accessToken, refreshToken },
            "User logged in successfully"
        ))
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        { 
            $set: { refreshToken: undefined, }
         },
        { new: true }
    )

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    }

    return res
        .status(200)
        .clearcookie("accessToken", options)
        .clearcookie("refreshToken", options)
        .json(new ApiResponse(
            200,
            {},
            "User logged out successfully."
        ))
        
})


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is required.")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken, 
            process.env.REFRESH_TOKEN_SECRET,
        )
        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "User not found.")
        }
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(403, "Invalid refresh token.")
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id)
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                200,
                {accessToken, 
                    refreshToken: newRefreshToken 
                },
                "Access token refreshed successfully."
            ));


    } catch (error) {
        console.log("Error while refreshing access token", error)
        throw new ApiError(500, "Something went wrong while refreshing access token.")
    }
})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordValid = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid credentials.")
    }

    user.password = newPassword

    await user.save({validationBeforeSave: false})
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {},
            "Password changed successfully."
        ))
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            req.user,
            "Current user fetched successfully."
        ))
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullname, email} = req.body

    //validation
    if([fullname, email, username].some((field)=>field?.trim() === "")){
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullname,
                email:email,
            }
        },
        {new: true}
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            user,
            "User details updated successfully."
        ))
})

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required.")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(500, "Failed to upload avatar.")
    }
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.url,
            }
        },
        {new: true}
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            user,
            "User avatar updated successfully."
        ))
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverLocalPath = req.file?.path

    if (!coverLocalPath){
        throw new ApiError(400, "Cover image file is required.")
    }

    const coverImage = await uploadOnCloudinary(coverLocalPath)

    if (!coverImage.url) {
        throw new ApiError(500, "Failed to upload cover image.")
    }
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImage.url,
            }
        },
        {new: true}
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            user,
            "User cover image updated successfully."
        ))
})

export {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}