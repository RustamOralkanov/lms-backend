import express from "express";
import upload from "../utils/multer";
import { uploadMedia } from "../utils/cloudinary";
import { Request,Response } from "express";

const router=express.Router();
router.route("/upload-video").post(upload.single("file"),async(req:Request,res:Response):Promise<void>=>{
    try{
        //@ts-ignore
        const result=await uploadMedia(req.file.path);
        res.status(200).json({
            success:true,
            message:"File uploaded Succesfully",
            data:result
        })
    }catch (error) {
        console.log(error);
        res.status(500).json({
            message:"Error uploading File"
        })
    }
    return ;
})
export default router;