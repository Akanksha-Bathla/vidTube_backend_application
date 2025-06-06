import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const channelId = req.user._id;
    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID.");
    }
    const totalVideos = await Video.countDocuments({ owner: channelId });
    const totalSubscribers = await Subscription.countDocuments({ channel: channelId });
    const totalLikes = await Like.countDocuments({ video: { $in: await Video.find({ owner: channelId }).distinct('_id') } });
    const totalViews = await Video.aggregate([
        { $match: { owner: channelId } },
        { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]);
    const stats = {
        totalVideos,
        totalSubscribers,
        totalLikes,
        totalViews: totalViews.length > 0 ? totalViews[0].totalViews : 0
    };
    return res.status(200).json(
        new ApiResponse(200, stats, "Channel stats fetched successfully.")
    );
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const channelId = req.user._id;
    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID.");
    }
    const videos = await Video.find({ owner: channelId })
        .populate("owner", "username avatar.url")
        .sort({ createdAt: -1 })
        .lean();
    if (!videos || videos.length === 0) {
        return res.status(404).json(
            new ApiResponse(404, null, "No videos found for this channel.")
        );
    }
    return res.status(200).json(
        new ApiResponse(200, videos, "Channel videos fetched successfully.")
    );
})

export {
    getChannelStats, 
    getChannelVideos
    }