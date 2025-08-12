import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({});

const createIndexes = async () => {
    try {
        if (typeof process.env.MONGO_URI === "undefined") {
            console.error("Error: MONGO_URI is undefined. Exiting...");
            return;
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for creating indexes");

        // Создаем индексы для улучшения производительности
        const db = mongoose.connection.db;

        if (!db) {
            console.error("Database connection failed");
            return;
        }

        // Индекс для коллекции пользователей
        await db.collection("users").createIndex({ email: 1 }, { unique: true });
        console.log("Created index on users.email");

        // Индекс для коллекции курсов
        await db.collection("courses").createIndex({ title: 1 });
        console.log("Created index on courses.title");

        // Индекс для коллекции покупок курсов
        await db.collection("coursepurchases").createIndex({ userId: 1, courseId: 1 });
        console.log("Created index on coursepurchases.userId and courseId");

        // Индекс для коллекции прогресса курсов
        await db.collection("courseprogresses").createIndex({ userId: 1, courseId: 1 });
        console.log("Created index on courseprogresses.userId and courseId");

        console.log("All indexes created successfully");

        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    } catch (e) {
        console.error("Error creating indexes:", e);
        process.exit(1);
    }
};

// Запускаем создание индексов если файл запущен напрямую
if (require.main === module) {
    createIndexes();
}

export default createIndexes;
