import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const isAuthenticated = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.cookies.token;

        if (!token) {
            res.status(401).json({
                message: "User not authenticated",
                success: false,
            });
            return;
        }

        if (!process.env.SECRET_KEY) {
            console.error("SECRET_KEY is not defined in environment variables");
            res.status(500).json({
                message: "Server configuration error",
                success: false,
            });
            return;
        }

        const decode = jwt.verify(token, process.env.SECRET_KEY);
        if (!decode) {
            res.status(401).json({
                message: "Invalid Token",
                success: false,
            });
            return;
        }

        //@ts-ignore
        req.id = decode.userId;
        next();
    } catch (e) {
        console.error("Authentication error:", e);
        res.status(401).json({
            message: "Invalid or expired token",
            success: false,
        });
    }
};

export default isAuthenticated;
