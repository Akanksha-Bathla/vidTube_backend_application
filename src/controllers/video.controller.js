import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", owner } = req.query;

  page = Number(page);
  limit = Number(limit);

  // Build match stage for aggregate
  const match = { isPublished: true };  // example: only published videos

  if (query) {
    match.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } }
    ];
  }

  if (owner) {
    match.owner = mongoose.Types.ObjectId(owner);
  }

  // Build aggregate pipeline
  const aggregate = Video.aggregate([
    { $match: match },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails"
      }
    },
    {
      $unwind: {
        path: "$ownerDetails",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        views: 1,
        duration: 1,
        isPublished: 1,
        owner: "$ownerDetails._id",
        ownerName: "$ownerDetails.username",
        createdAt: 1,
        updatedAt: 1
      }
    }
  ]);

  const options = {
    page,
    limit,
    sort: { [sortBy]: sortType.toLowerCase() === "asc" ? 1 : -1 },
  };

  const result = await Video.aggregatePaginate(aggregate, options);

  return res.status(200).json({
    success: true,
    statusCode: 200,
    data: result,
    message: "Videos fetched successfully"
  });
});


const publishAVideo = asyncHandler(async (req, res) => {
  	const { title, description } = req.body;
  	const videoLocalPath = req.files?.videoFile?.[0]?.path;
	const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

	if (!title || !description || !videoLocalPath || !thumbnailLocalPath) {
		console.log("title:", title);
		console.log("desc:", description);
		console.log("video:", videoLocalPath);
		console.log("thumb:", thumbnailLocalPath);
		throw new ApiError(400, "Title, description, video, and thumbnail are required.");
	}

	// Upload video
	const videoUpload = await uploadOnCloudinary(videoLocalPath, "video");
	if (!videoUpload?.url) {
		throw new ApiError(500, "Video upload failed.");
	}

	// Upload thumbnail
	const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath);
	if (!thumbnailUpload?.url) {
		throw new ApiError(500, "Thumbnail upload failed.");
	}

	const newVideo = await Video.create({
		videoFile: {
			url: videoUpload.url,
			public_id: videoUpload.public_id,
		},
		thumbnail: {
			url: thumbnailUpload.url,
			public_id: thumbnailUpload.public_id,
		},
		title,
		description,
		duration: videoUpload.duration || 0,
		owner: req.user._id,
		isPublished: true, // Automatically publish on creation
	});

	return res.status(201).json(
		new ApiResponse(201, newVideo, "Video published successfully.")
	);
});


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID.");
    }

    const video = await Video.findById(videoId)
    	.populate("owner", "username")
    	.lean();
	
    if (!video) {
        throw new ApiError(404, "Video not found.");
    }
	if (!video.isPublished && video.owner._id.toString() !== req.user._id.toString()) {
    	throw new ApiError(403, "This video is not published.");
		}
		
    return res.status(200).json({
        success: true,
        statusCode: 200,
        data: video,
        message: "Video fetched successfully."
    });
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
	// 1. Validate videoId
	if (!isValidObjectId(videoId)) {
		throw new ApiError(400, "Invalid video ID.");
	}

	// 2. Find video by ID
	const video = await Video.findById(videoId);
	if (!video) {
		throw new ApiError(404, "Video not found.");
	}

	// 3. Check if the user is the owner of the video
	if (video.owner.toString() !== req.user._id.toString()) {
		throw new ApiError(403, "You are not authorized to update this video.");
	}

	const { title, description } = req.body;
	
	// 4. Update fields if provided
	if (title) video.title = title;
	if (description) video.description = description;

	// 5. Update thumbnail if uploaded
	if (req.file?.path) {
		const thumbnailLocalPath = req.file.path;

        // Delete old thumbnail from Cloudinary
        if (video.thumbnail.public_id) {
            await deleteFromCloudinary(video.thumbnail.public_id);
        }

        // Upload new thumbnail
        const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath);
        if (!thumbnailUpload?.url) {
            throw new ApiError(500, "Thumbnail upload failed.");
        }

        // Update thumbnail object
		video.thumbnail = {
			url: thumbnailUpload.url,
			public_id: thumbnailUpload.public_id
		};
    }

	await video.save();

	return res.status(200).json({
		success: true,
		statusCode: 200,
		data: video,
		message: "Video updated successfully."
	});
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // 1. Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID.");
    }

    // 2. Find video
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found.");
    }

    // 3. Check ownership
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video.");
    }

    // 4. Delete video and thumbnail from Cloudinary
    if (video.videoFile?.public_id) {
        await deleteFromCloudinary(video.videoFile.public_id);
    }
    if (video.thumbnail?.public_id) {
        await deleteFromCloudinary(video.thumbnail.public_id);
    }

    // 5. Delete video from DB
    await Video.findByIdAndDelete(videoId);

    // 6. Respond
    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Video deleted successfully.",
    });
});


const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
	if (!isValidObjectId(videoId)) {
		throw new ApiError(400, "Invalid video ID.");
	}

	const video = await Video.findById(videoId);
	if (!video) {
		throw new ApiError(404, "Video not found.");
	}

	if (video.owner.toString() !== req.user._id.toString()) {
		throw new ApiError(403, "You are not authorized to change the publish status of this video.");
	}

	video.isPublished = !video.isPublished;
	await video.save();
	return res.status(200).json({
		success: true,
		statusCode: 200,
		data: video,
		message: `Video is now ${video.isPublished ? "published" : "unpublished"}.`
	});
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}