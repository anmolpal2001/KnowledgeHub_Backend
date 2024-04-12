import express from "express";
import { approveSession, rejectSession,cancelledRequests, getTeacherBookedSessions, updateProfile,getAllBookingRequests } from "../controllers/teacher.js"
import { auth, isTeacher } from "../middlewares/auth.js";


const router = express.Router();

router.post("/approveSession",auth,isTeacher,approveSession);
router.post("/rejectSession",auth,isTeacher,rejectSession);
router.get("/getTeacherbookedSessions", auth,isTeacher,getTeacherBookedSessions);
router.post("/updateProfile",auth, isTeacher, updateProfile);
router.get("/getAllBookingRequests",auth,isTeacher,getAllBookingRequests);
router.get("/cancelledRequests",auth,isTeacher,cancelledRequests);

export default router;