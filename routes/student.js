import express from "express";
import { bookSession, getbookedSessions, getAvailableSlots,rejectedRequestsList,getAllTeachers, sessionRequestList, cancelSession, updateProfile,getStudentInfo} from "../controllers/student.js";
import {auth,isStudent} from "../middlewares/auth.js";

const router = express.Router();

router.get("/getAllTeachers",auth,isStudent, getAllTeachers); //done
router.post("/bookSession",auth,isStudent,bookSession); //done
router.get("/getbookedSessions",auth,isStudent,getbookedSessions); //dpne
router.get("/getInfo",auth,isStudent,getStudentInfo);
// router.get("/getAvailableSlots",auth,isStudent,getAvailableSlots);
router.get("/sessionRequestList",auth,isStudent,sessionRequestList); //done
router.post("/cancelSession",auth,isStudent,cancelSession); //done
router.post("/updateProfile",auth,isStudent,updateProfile);
router.get("/rejectedRequestsList",auth,isStudent,rejectedRequestsList);



export default router;