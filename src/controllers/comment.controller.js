import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js";
import {Tweet} from "../models/tweet.model.js";

const getComments = asyncHandler(async (req, res) => {
    const { entityType, entityId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    let refField;
    let Model;

    switch (entityType) {
        case "video":
            Model = Video;
            refField = "video";
            break;
        case "tweet":
            Model = Tweet;
            refField = "tweet";
            break;
        default:
            throw new ApiError(400, "Invalid entity type");
    }

    const entity = await Model.findById(entityId);
    if (!entity) {
        throw new ApiError(404, `${entityType} not found`);
    }

    const comments = await Comment.find({ [refField]: entityId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate("owner", "username avatar.url")
        .lean();

    const totalComments = await Comment.countDocuments({ [refField]: entityId });

    return res.status(200).json(
        new ApiResponse(200, {
            comments,
            totalPages: Math.ceil(totalComments / limit),
            currentPage: parseInt(page),
            totalComments
        }, "Comments fetched successfully.")
    );
});


const addComment = asyncHandler(async (req, res) => {
    const { entityType, entityId } = req.params;
    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, "Comment content is required");
    }

    let refField;
    let Model;

    switch (entityType) {
        case "video":
            Model = Video;
            refField = "video";
            break;
        case "tweet":
            Model = Tweet;
            refField = "tweet";
            break;
        default:
            throw new ApiError(400, "Invalid entity type");
    }

    const entity = await Model.findById(entityId);
    if (!entity) {
        throw new ApiError(404, `${entityType} not found`);
    }

    const commentData = {
        content,
        owner: req.user._id,
        [refField]: entityId,
    };

    const comment = await Comment.create(commentData);

    return res.status(201).json(
        new ApiResponse(201, comment, "Comment added successfully")
    );
});


const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;
    const { content } = req.body;
    if (!content) {
        throw new ApiError(400, "Comment content is required");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Check if the current user is the owner of the comment
    if (!comment.owner || comment.owner.toString() !== req.user._id.toString()) {
        console.log("Comment owner:", comment.owner?.toString());
        console.log("Logged in user:", req.user?._id?.toString());
        throw new ApiError(403, "You are not allowed to update this comment");
    }

    comment.content = content;
    await comment.save();

    return res.status(200).json(
        new ApiResponse(200, comment, "Comment updated successfully")
    );
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Check if the current user is the owner of the comment
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this comment");
    }

    await comment.deleteOne();

    return res.status(200).json(
        new ApiResponse(200, null, "Comment deleted successfully")
    );
});

export {
    getComments, 
    addComment, 
    updateComment,
    deleteComment
}
