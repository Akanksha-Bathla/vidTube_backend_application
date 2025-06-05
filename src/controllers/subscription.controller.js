import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID.");
    }
    const userId = req.user._id;
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found.");
    }
    const subscription = await Subscription.findOne({
        subscriber: userId,
        channel: channelId
    });

    if (subscription) {
        // User is already subscribed, so unsubscribe them
        await subscription.remove();
        return res.status(200).json(
            new ApiResponse(200, null, "Unsubscribed from channel successfully.")
        );
    }

    // User is not subscribed, so subscribe them
    await Subscription.create({
        subscriber: userId,
        channel: channelId
    });

    return res.status(200).json(
        new ApiResponse(200, null, "Subscribed to channel successfully.")
    );
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if (!isValidObjectId(channelId)) {
        console.log(channelId);
        throw new ApiError(400, "Invalid channel ID.");
    }

    const subscribers = await Subscription.find({ channel: channelId })
        .populate("subscriber", "username avatar.url")
        .lean();

    return res.status(200).json(
        new ApiResponse(200, subscribers, "Channel subscribers fetched successfully.")
    );
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if (!isValidObjectId(subscriberId)) {
        console.log(subscriberId);
        throw new ApiError(400, "Invalid subscriber ID.");
    }

    const subscriptions = await Subscription.find({ subscriber: subscriberId })
        .populate("channel", "title thumbnail")
        .lean();

    return res.status(200).json(
        new ApiResponse(200, subscriptions, "User subscribed channels fetched successfully.")
    );
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}