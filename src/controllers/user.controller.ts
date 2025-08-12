import { Request, Response } from "express";
import { User } from "../models/user.model";
import bcrypt from "bcryptjs";

import { generateToken } from "../utils/generateToken";
import { deleteMediafromCloudinary, uploadMedia } from "../utils/cloudinary";

export const register = async ({ body }: Request, res: Response): Promise<void> => {
    try {
        const { name, phone, password } = body;

        if (!name || !phone || !password) {
            res.status(400).json({
                success: false,
                message: "All fields are required.",
            });
            return;
        }
        const user = await User.findOne({ phone });
        if (user) {
            res.status(400).json({
                success: false,
                message: "User Already Exist with this phone.",
            });
            return;
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            name,
            phone,
            password: hashedPassword,
        });

        res.status(201).json({
            success: true,
            message: "Account Created successfully.",
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: "Failed To register",
        });
    }
};

export const login = async ({ body }: Request, res: Response): Promise<void> => {
    try {
        const { phone, password } = body;

        if (!phone || !password) {
            res.status(400).json({
                success: false,
                message: "All fields are required.",
            });
            return;
        }

        const user = await User.findOne({ phone }).select("+password");

        if (!user) {
            res.status(400).json({
                success: false,
                message: "Incorrect Email or password",
            });
            return;
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
            res.status(400).json({
                success: false,
                message: "Incorrect Email or password",
            });
            return;
        }

        const userWithoutPassword = {
            _id: user._id,
            name: user.name,
            phone: user.phone,
            role: user.role,
            enrolledCourses: user.enrolledCourses,
            photoUrl: user.photoUrl,
        };

        generateToken(res, userWithoutPassword, `Welcome back ${user.name}`);
    } catch (e) {
        res.status(500).json({
            success: false,
            message: "Failed to login",
        });
        return;
    }
};

export const logout = async (_: Request, res: Response): Promise<void> => {
    try {
        res.status(200).cookie("token", "", { maxAge: 0 }).json({
            message: "Logged Out Sucessfully",
            success: true,
        });
        return;
    } catch (e) {
        res.status(500).json({
            success: false,
            message: "Failed To logout",
        });
        return;
    }
};

export const getUserProfile = async (req: Request, res: Response) => {
    try {
        //@ts-ignore
        const userId = req.id;
        const user = await User.findById(userId).select("-password").populate("enrolledCourses");
        if (!user) {
            res.status(404).json({
                message: "Profile not found",
                success: false,
            });
            return;
        }

        res.status(200).json({
            success: true,
            user,
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({
            success: false,
            message: "Failed To get user.",
        });
    }
    return;
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        //@ts-ignore
        const userId = req.id;
        const { name } = req.body;

        const profilePhoto = req.file;
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({
                message: "Profile not found",
                success: false,
            });
            return;
        }
        let photoUrl = user.photoUrl || undefined;

        if (profilePhoto) {
            if (user.photoUrl) {
                const publicId = user.photoUrl.split("/").pop()?.split(".")[0];
                deleteMediafromCloudinary(publicId || " ");
            }
            const cloudResponse = await uploadMedia(profilePhoto.path);
            photoUrl = cloudResponse?.secure_url;
        }

        const updatedData = { name, ...(photoUrl && { photoUrl }) };
        const updatedUser = await User.findByIdAndUpdate(userId, updatedData, { new: true }).select("-password");

        res.status(200).json({
            sucess: true,
            user: updatedUser,
            message: "Profile Updated Succesfully",
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: "Failed To update user.",
        });
    }
    return;
};
