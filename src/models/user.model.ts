import mongoose from "mongoose";

export interface User {
    _id: mongoose.Types.ObjectId;
    name?: String;
    phone?: String;
    password?: String;
}
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        role: {
            type: String,
            enum: ["instructor", "student"],
            default: "student",
        },
        enrolledCourses: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Course",
            },
        ],
        photoUrl: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
