import mongoose from "mongoose";

const connectDB = async () => {
    try {
        if (typeof process.env.MONGO_URI === "undefined") {
            console.error("Error: MONGO_URI is undefined. Exiting...");
            return;
        }

        // Оптимизированные настройки подключения
        await mongoose.connect(process.env.MONGO_URI, {
            maxPoolSize: 10, // Максимальное количество соединений в пуле
            serverSelectionTimeoutMS: 5000, // Таймаут выбора сервера
            socketTimeoutMS: 45000, // Таймаут сокета
            bufferCommands: false, // Отключаем буферизацию команд
        });

        console.log("Connected to MongoDB successfully");

        // Обработка событий подключения
        mongoose.connection.on("error", (err) => {
            console.error("MongoDB connection error:", err);
        });

        mongoose.connection.on("disconnected", () => {
            console.log("MongoDB disconnected");
        });
    } catch (e) {
        console.error("Database connection error:", e);
        process.exit(1);
    }
};

export default connectDB;
