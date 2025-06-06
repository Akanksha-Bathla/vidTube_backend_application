import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID.");
    }
    const userId = req.user._id;
    console.log("User ID:", userId);
    console.log("Video ID:", videoId);
    const like = await Like.findOne({ likedBy: userId, video: videoId });
    if (like) {
        // User has already liked the video, so remove the like
        await like.deleteOne();
        return res.status(200).json(
            new ApiResponse(200, videoId, "Video unliked successfully.")
        );
    }
    // User has not liked the video, so add the like
    await Like.create({
        likedBy: userId,
        video: videoId
    });
    return res.status(200).json(
        new ApiResponse(200, videoId, "Video liked successfully.")
    );
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID.");
    }
    const userId = req.user._id;
    const like = await Like.findOne({ likedBy: userId, comment: commentId });
    if (like) {
        // User has already liked the comment, so remove the like
        await like.deleteOne();
        return res.status(200).json(
            new ApiResponse(200, commentId,"Comment unliked successfully.")
        );
    }
    // User has not liked the comment, so add the like
    await Like.create({
        likedBy: userId,
        comment: commentId
    });
    return res.status(200).json(
        new ApiResponse(200, commentId, "Comment liked successfully.")
    );
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID.");
    }
    const userId = req.user._id;
    const like = await Like.findOne({ likedBy: userId, tweet: tweetId });
    if (like) {
        // User has already liked the tweet, so remove the like
        await like.deleteOne();
        return res.status(200).json(
            new ApiResponse(200, tweetId, "Tweet unliked successfully.")
        );
    }
    // User has not liked the tweet, so add the like
    await Like.create({
        likedBy: userId,
        tweet: tweetId
    });
    return res.status(200).json(
        new ApiResponse(200, tweetId, "Tweet liked successfully.")
    );
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id;
    const likes = await Like.find({ likedBy: userId, video: { $exists: true } })
        .populate("video", "title thumbnail.url")
        .lean();
    if (!likes || likes.length === 0) {
        return res.status(404).json(
            new ApiResponse(404, null, "No liked videos found.")
        );
    }
    return res.status(200).json(
        new ApiResponse(200, likes, "Liked videos fetched successfully.")
    );
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}