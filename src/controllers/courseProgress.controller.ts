import { Request,Response } from "express"
import { CourseProgress } from "../models/courseProgress";
import { Course } from "../models/course.model";

export const getCourseProgress=async(req:Request,res:Response)=>{
    try{
        const {courseId}=req.params;
        //@ts-ignore
        const userId=req.id;
        let courseProgress = await CourseProgress.findOne({
            courseId,
            userId,
          }).populate("courseId");
      
          const courseDetails = await Course.findById(courseId).populate("lectures");
        if(!courseDetails){
            res.status(404).json({
                message:"Course not found"
            })
            return ;
        }
        //step-2 if no progress found ,return course details with empty progress
        if(!courseProgress){
            res.status(200).json({
                data:{
                    courseDetails,
                    progress:[],
                    completed:false
                }
            })
            return;
        }
        //step-3 return 
        res.status(200).json({
            data:{
                courseDetails,
                progress:courseProgress?.lectureProgress,
                completed:courseProgress?.completed
            }
        })
    }catch(e){
        console.log(e);
        res.status(500).json({
            message:"Cannot fetch course progress"
        })
    }
}
export const updateLectureProgress=async(req:Request,res:Response):Promise<void>=>{
    try{
        const{courseId,lectureId}=req.params;
        //@ts-ignore
        const userId=req.id;
        let courseProgress=await CourseProgress.findOne({courseId,userId});
        if(!courseProgress){
            // if no progress exists create new on e
            courseProgress=new CourseProgress({
                userId:userId,
                courseId,
                completed:false,
                lectureProgress:[],
            }); 
        }
        //find the lecture progress in the course progress
        const lectureIndex=courseProgress.lectureProgress.findIndex((lecture)=>lecture.lectureId===lectureId);
        if(lectureIndex!==-1){
            // if lecture already exists
            courseProgress.lectureProgress[lectureIndex].viewed=true;
        }else{
            //Add new lecture progress
            courseProgress.lectureProgress.push({
                lectureId,
                viewed:true
            })
        }

        const lectureProgressLength=courseProgress.lectureProgress.filter((lecturePro)=>lecturePro.viewed)
        //find course and checked are viewed same as the total no,
        const course=await Course.findById(courseId);
        if(course?.lectures.length===updateLectureProgress.length){
            courseProgress.completed=true;
        } 
        await courseProgress.save();
        res.status(200).json({
            message:"Lecture progress updated Successfully."
        })
    }catch(e){
        console.log(e);
        res.status(500).json({
            message:"Cannot update lecture progress"
        })
    }
    return ;
}

export const markAsCompleted=async(req:Request,res:Response):Promise<void>=>{
    try{
        const {courseId}=req.params;
        //@ts-ignore
        const userId=req.id;
        const courseProgress=await CourseProgress.findOne({courseId,userId});
        if(!courseProgress){
            res.status(404).json({
                message:"Course progress not found"
            })
            return ;
        }
        courseProgress.lectureProgress.map((lectureProgress)=>lectureProgress.viewed=true)
        courseProgress.completed=true;
        await courseProgress.save();
        res.status(200).json({message:"Course Marked as Complete!"})
    }catch(e){
        console.log(e);
        res.status(500).json({
            message:"Cannot mark as completed"
        })
    }
    return 
}
export const markAsIncompleted=async(req:Request,res:Response):Promise<void>=>{
    try{
        const {courseId}=req.params;
        //@ts-ignore
        const userId=req.id;
        const courseProgress=await CourseProgress.findOne({courseId,userId});
        if(!courseProgress){
            res.status(404).json({
                message:"Course progress not found"
            })
            return ;
        }
        courseProgress.lectureProgress.map((lectureProgress)=>lectureProgress.viewed=false);
        courseProgress.completed=false;
        await courseProgress.save();
        res.status(200).json({message:"Course Marked as Complete!"})
    }catch(e){
        console.log(e);
        res.status(500).json({
            message:"Cannot mark as completed"
        })
    }
    return 
}