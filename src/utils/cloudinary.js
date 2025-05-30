import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
import dotenv from "dotenv";

dotenv.config()

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return { url: "", public_id: "" };

        const response = await cloudinary.uploader.upload(
            localFilePath,{
                resource_type: "auto"
            }
        )
        console.log("File Uploaded on Cloudinary. File src: " + response.secure_url)
        //once the file is uploaded, we would like to delete it from our server
        // Delete the file safely
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return { 
            url: response.secure_url,
            public_id: response.public_id
        };
    } catch (error) {
        console.log("Cloudinary upload error:", error);

        // Delete the file safely
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return { url: "", public_id: "" };
    }
}

const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId)
        console.log("Deleted from cloudinary. Public Id", publicId)
        return result;
    } catch (error) {
        console.log("Error deleting from cloudinary", error)
        return null
    }
}


export {uploadOnCloudinary, deleteFromCloudinary}
