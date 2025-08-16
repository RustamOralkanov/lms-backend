import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./database/dbConnect";
import userRoute from "./routes/user.route";
import courseRoute from "./routes/course.route";
import mediaRoute from "./routes/media.route";
import progressRoute from "./routes/courseProgress.route";
import mongoose from "mongoose";

import cors from "cors";

// Загружаем переменные окружения в начале
dotenv.config({});

const app = express();

// Middleware для мониторинга времени выполнения запросов
app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    });
    next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(
    cors({
        origin: "http://localhost:7000",
        credentials: true,
    })
);

// Подключаемся к базе данных
connectDB();

let PORT = process.env.PORT || 5000;

// Маршруты
app.use("/api/v1/media", mediaRoute);
app.use("/api/v1/user", userRoute);
app.use("/api/v1/course", courseRoute);
app.use("/api/v1/progress", progressRoute);

app.get("/home", (_: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: "Hello from backend",
    });
});

// Маршрут для проверки состояния сервера и базы данных
app.get("/api/v1/health", (_: Request, res: Response) => {
    const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    const envStatus = {
        SECRET_KEY: !!process.env.SECRET_KEY,
        MONGO_URI: !!process.env.MONGO_URI,
        PORT: process.env.PORT || 5000,
    };

    res.status(200).json({
        success: true,
        message: "Server is running",
        database: dbStatus,
        environment: envStatus,
        timestamp: new Date().toISOString(),
    });
});

// Обработка ошибок
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("Error:", err);
    res.status(500).json({
        success: false,
        message: "Internal server error",
    });
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`Database ready state: ${mongoose.connection.readyState}`);
    console.log(`Environment variables loaded: SECRET_KEY=${!!process.env.SECRET_KEY}, MONGO_URI=${!!process.env.MONGO_URI}`);
});
