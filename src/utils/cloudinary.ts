import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config({});

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_secret: process.env.API_SECRET,
    api_key: process.env.API_KEY,
});

export const uploadMedia = async (file: any) => {
    try {
        const uploadResponse = await cloudinary.uploader.upload(file, {
            resource_type: "auto",
        });
        return uploadResponse;
    } catch (e) {
        console.log(e);
    }
};

export const deleteMediafromCloudinary = async (publicId: string) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (e) {
        console.log(e);
    }
};

export const deleteVideoForCloudinary = async (publicId: string) => {
    try {
        await cloudinary.uploader.destroy(publicId, {
            resource_type: "video",
        });
    } catch (e) {
        console.log(e);
    }
};
