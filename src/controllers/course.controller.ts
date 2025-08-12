import { Request, Response } from "express";
import { Course } from "../models/course.model";
import { deleteMediafromCloudinary, deleteVideoForCloudinary, uploadMedia } from "../utils/cloudinary";
import { Lecture } from "../models/lectures.model";
import { User } from "../models/user.model";

export const createCourse = async (req: Request, res: Response): Promise<void> => {
    try {
        const { courseTitle, category } = req.body;
        if (!courseTitle && !category) {
            res.status(400).json({
                message: "Course title and category are requied.",
            });
            return;
        }
        const course = await Course.create({
            courseTitle,
            category,
            //@ts-ignore
            creator: req.id,
        });
        res.status(201).json({
            course,
            message: "Course Created",
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({
            message: e,
        });
    }
    return;
};
export const getAllCreatorCourses = async (req: Request, res: Response): Promise<void> => {
    try {
        //@ts-ignore
        const userId = req.id;
        const courses = await Course.find({ creator: userId });
        if (!courses) {
            res.status(404).json({
                courses: [],
                message: "Course not found",
            });
            return;
        }
        res.status(200).json({
            courses,
        });
    } catch (e) {
        res.status(500).json({
            message: "Failed to fetch courses",
        });
    }
    return;
};
export const editCourse = async (req: Request, res: Response): Promise<void> => {
    try {
        const courseId = req.params.courseId;
        const { courseTitle, subTitle, description, category, courseLevel, coursePrice } = req.body;

        const thumbnail = req.file;
        let course = await Course.findById(courseId);
        if (!course) {
            res.status(404).json({
                message: "Course not found!",
            });
            return;
        }
        let courseThumbnail;
        if (thumbnail) {
            if (course.courseThumbnail) {
                //@ts-ignore
                const publicId = course.courseThumbnail.split("/").pop().split(".")[0] || "";
                await deleteMediafromCloudinary(publicId); // delete old image
            }
            // upload a thumbnail on clourdinary
            courseThumbnail = await uploadMedia(thumbnail.path);
        }

        const updateData = {
            courseTitle,
            subTitle,
            description,
            category,
            courseLevel,
            coursePrice,
            courseThumbnail: courseThumbnail?.secure_url,
        };

        course = await Course.findByIdAndUpdate(courseId, updateData, { new: true });

        res.status(200).json({
            course,
            message: "Course updated successfully.",
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Failed to update course",
        });
    }
    return;
};

export const getCourseById = async (req: Request, res: Response): Promise<void> => {
    try {
        const courseId = req.params.courseId;
        const course = await Course.findById(courseId);
        if (!course) {
            res.status(404).json({
                message: "Course not found",
            });
            return;
        }
        res.status(200).json({
            course,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Failed to Fetch course",
        });
    }
    return;
};
export const removeCourse = async (req: Request, res: Response): Promise<void> => {
    try {
        const courseId = req.params.courseId;
        const course = await Course.findById(courseId);
        if (!course) {
            res.status(404).json({
                message: "Course Not Found",
            });
            return;
        }
        course.lectures.forEach(async (lectureId) => {
            const lecture = await Lecture.findByIdAndDelete(lectureId);
            if (lecture?.publicId) {
                await deleteVideoForCloudinary(lecture?.publicId);
            }
        });
        if (course.courseThumbnail) {
            //@ts-ignore
            const publicId = course.courseThumbnail.split("/").pop().split(".")[0] || "";
            await deleteMediafromCloudinary(publicId); // delete thumbnail
        }
        await Course.findByIdAndDelete(courseId);
        res.status(200).json({
            message: "Course Removed!",
            course,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Failed to Remove course",
        });
    }
    return;
};
export const getPublishedCourse = async (req: Request, res: Response): Promise<void> => {
    try {
        const courses = await Course.find({ isPublished: true }).populate({ path: "creator", select: "name photoUrl" });

        if (!courses) {
            res.status(404).json({
                message: "Course not found",
            });
            return;
        }
        res.status(200).json({
            courses,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Failed to get Published courses",
        });
    }
    return;
};
export const createLecture = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lectureTitle } = req.body;
        const { courseId } = req.params;

        if (!lectureTitle || !courseId) {
            res.status(400).json({
                message: "Lecture title and course id is required",
            });
            return;
        }

        const lecture = await Lecture.create({ lectureTitle });

        const course = await Course.findById(courseId);

        if (course) {
            course.lectures.push(lecture._id);
            await course.save();
        }
        res.status(200).json({
            lecture,
            message: "Lecture Created Successfully.",
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to create lecture",
        });
    }
    return;
};
export const searchCourse = async (req: Request, res: Response): Promise<void> => {
    try {
        const { query = "", categories = [], sortByPrice = "" } = req.query;
        console.log(categories);
        console.log(query);

        // create search query
        const searchCriteria = {
            isPublished: true,
            $or: [
                { courseTitle: { $regex: query, $options: "i" } },
                { subTitle: { $regex: query, $options: "i" } },
                { category: { $regex: query, $options: "i" } },
            ],
        };
        // if categories selected
        //@ts-ignore
        if (categories.length > 0) {
            //@ts-ignore
            searchCriteria.category = { $in: categories };
        }

        // define sorting order
        const sortOptions = {};
        if (sortByPrice === "low") {
            //@ts-ignore
            sortOptions.coursePrice = 1; //sort by price in ascending
        } else if (sortByPrice === "high") {
            //@ts-ignore
            sortOptions.coursePrice = -1; // descending
        }

        let courses = await Course.find(searchCriteria)
            .populate({ path: "creator", select: "name photoUrl" })
            .sort(sortOptions);

        res.status(200).json({
            success: true,
            courses: courses || [],
        });
        console.log("here2");
    } catch (error) {
        console.log(error);
    }
    return;
};

export const getCourseLecture = async (req: Request, res: Response): Promise<void> => {
    try {
        const { courseId } = req.params;
        const course = await Course.findById(courseId).populate("lectures");
        if (!course) {
            res.status(404).json({
                message: "Course not found",
            });
            return;
        }
        res.status(200).json({
            lectures: course.lectures,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Failed to get lectures.",
        });
    }
    return;
};
export const editLecture = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lectureTitle, videoInfo, isPreviewFree } = req.body;
        console.log(req.body);
        const { courseId, lectureId } = req.params;
        console.log(videoInfo);
        const lecture = await Lecture.findById(lectureId);
        if (!lecture) {
            res.status(404).json({
                message: "Lecture not found!",
            });
            return;
        }
        //update lecture
        if (lectureTitle) lecture.lectureTitle = lectureTitle;
        if (videoInfo.videoUrl && videoInfo.videoUrl.length != 0) lecture.videoUrl = videoInfo.videoUrl;
        if (videoInfo.publicId && videoInfo.publicId.length != 0) lecture.publicId = videoInfo.publicId;
        if (isPreviewFree) lecture.isPreviewFree = isPreviewFree;
        await lecture.save();
        // ensure course still has the lecture  id  if it changes somehow
        const course = await Course.findById(courseId);
        if (course && !course.lectures.includes(lecture._id)) {
            course.lectures.push(lecture._id);
            await course.save();
        }
        res.status(200).json({
            lecture,
            message: "Lecture Updated Successfully !",
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Failed to Edit lecture.",
        });
    }
    return;
};

export const removeLecture = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lectureId } = req.params;
        const lecture = await Lecture.findByIdAndDelete(lectureId);
        if (!lecture) {
            res.status(404).json({
                message: "Lecture not found",
            });
            return;
        }
        //delete lecture from cloudinary also
        if (lecture.publicId) {
            await deleteVideoForCloudinary(lecture.publicId);
        }
        // remove the lecture from the corresponding course
        await Course.updateOne(
            { lectures: lectureId }, // find the course  that contains this lectureId in its lectures
            { $pull: { lectures: lectureId } } // pull out this particular lecture from the lecture of that course.
        );
        res.status(200).json({
            message: "Lecture removed!",
        });
    } catch (e) {
        res.status(500).json({
            message: "Failed to remove lecture.",
        });
    }
    return;
};

export const getLectureById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lectureId } = req.params;
        const lecture = await Lecture.findById(lectureId);
        if (!lecture) {
            res.status(404).json({
                message: "Lecture not found",
            });
        }
        res.status(200).json({
            lecture,
        });
    } catch (e) {
        res.status(500).json({
            message: "Failed to get lecture by Id.",
        });
    }
    return;
};

export const tooglePublishCourse = async (req: Request, res: Response): Promise<void> => {
    try {
        const { courseId } = req.params;
        const { publish } = req.query;
        const course = await Course.findById(courseId);
        if (!course) {
            res.status(404).json({
                message: "Course Not Found",
            });
            return;
        }
        //publish status based on query param
        course.isPublished = publish === "true";
        await course.save();
        const statusMessage = course.isPublished ? "Published" : "UnPublished";
        res.status(200).json({
            message: `Course is ${statusMessage}`,
        });
    } catch (e) {
        res.status(500).json({
            message: "Failed to Update Status.",
        });
    }
    return;
};

// Enroll user to a course (no payment)
export const enrollCourse = async (req: Request, res: Response): Promise<void> => {
    try {
        const { courseId } = req.params;
        //@ts-ignore
        const userId = req.id;
        const course = await Course.findById(courseId);
        if (!course) {
            res.status(404).json({ message: "Course not found" });
            return;
        }

        await User.findByIdAndUpdate(userId, { $addToSet: { enrolledCourses: courseId } }, { new: true });
        await Course.findByIdAndUpdate(courseId, { $addToSet: { enrolledStudents: userId } }, { new: true });

        res.status(200).json({ success: true, message: "Enrolled successfully" });
    } catch (e) {
        console.log(e);
        res.status(500).json({ message: "Failed to enroll" });
    }
    return;
};

// Course details with enrollment status for current user
export const getCourseDetailWithStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { courseId } = req.params;
        //@ts-ignore
        const userId = req.id;
        const course = await Course.findById(courseId).populate({ path: "creator" }).populate({ path: "lectures" });
        if (!course) {
            res.status(404).json({ message: "Course Not Found" });
            return;
        }

        const enrolled = course.enrolledStudents?.map((id: any) => String(id)).includes(String(userId));

        res.status(200).json({ course, enrolled: !!enrolled });
    } catch (e) {
        console.log(e);
        res.status(500).json({ message: "Error fetching course details" });
    }
};

// Visible courses for current user: instructors see their created courses, students see only enrolled
export const getVisibleCourses = async (req: Request, res: Response): Promise<void> => {
    try {
        //@ts-ignore
        const userId = req.id;
        const user = await User.findById(userId).select("role");
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        let courses;
        if (user.role === "instructor") {
            courses = await Course.find({ creator: userId });
        } else {
            courses = await Course.find({ enrolledStudents: userId });
        }

        res.status(200).json({ courses: courses || [] });
    } catch (e) {
        console.log(e);
        res.status(500).json({ message: "Failed to fetch visible courses" });
    }
};
