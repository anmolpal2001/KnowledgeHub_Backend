import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";
import Session from "../models/Session.js";
import { sessionApproveEmail } from "../mail/templates/sessionApproveEmail.js";
import mailSender from "../mail/mailSender.js";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import { sessionRejectEmail } from "../mail/templates/sessionRejectEmail.js";
import cloudinary from 'cloudinary';


const approveSession = async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await Session.findById(sessionId);
    if (!session) {
        return res.status(404).json({ message: "Session not found" });
    };
    const teacherId = req.user.id;
    const teacher = await Teacher.findOne(session.teacher).populate('accountDetails');
    const student = await Student.findOne(session.student).populate('accountDetails');
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if the booking request exists in the student's bookingRequests array
    const conflictingSession  = teacher.acceptedBookings && teacher.acceptedBookings.find(
      (booking) => booking.date === session.date && booking.slot.start === session.slot.start && booking.slot.end === session.slot.end && booking.student !== student._id
    );
    if(conflictingSession ){
        return res.status(400).json({
            success : false,
            message : "You have already session with another student at this time"
        })
    }
    session.status = "Approved";
    await session.save();

    const emailResponse = await mailSender(
        student.accountDetails.email,
        "Session Approved",
        sessionApproveEmail(student.accountDetails.fullname,teacher.accountDetails.email, teacher.accountDetails.fullname, session.date, session.slot.start, session.slot.end)
    );

    teacher.bookingRequests = teacher.bookingRequests.filter(
        (booking) => booking._id.toString() !== sessionId
    );
    teacher.acceptedBookings.push(sessionId);
    await teacher.save();

    student.bookingRequests = student.bookingRequests.filter(
        (booking) => booking._id.toString() !== sessionId
    );
    student.bookedSlots.push(sessionId);
    await student.save();

    return res.status(200).json({
        success : true,
        session, 
        message: "Booking request approved successfully" 
    });
  } catch (error) {
    console.error("Error approving session:", error);
    return res.status(500).json({ 
        success : false,
        message: "Internal server error" 
    });
  }
};

const rejectSession = async (req, res) => {
  try {
    // Get the student id, day, and slot time from the request body
    const { sessionId } = req.body;

    const session = await Session.findById(sessionId);
    if (!session) {
        return res.status(404).json({ message: "Session not found" });
        }

    // Find the student by id
    const student = await Student.findById(session.student).populate({
      path : "accountDetails",
      select : "-password"
    });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    const teacher = await Teacher.findById(session.teacher).populate({
      path : "accountDetails",
      select : "-password"
    });
    
    session.status = "Rejected";
    
    const emailResponse = await mailSender(
      student.accountDetails.email,
      "Session Rejected",
      sessionRejectEmail(student.accountDetails.fullname,teacher.accountDetails.email, teacher.accountDetails.fullname, session.date, session.slot.start, session.slot.end)
  );
  await session.save();

    teacher.bookingRequests = teacher.bookingRequests.filter(
        (booking) => booking._id.toString() !== sessionId
    );
    teacher.cancelledRequests.push(sessionId);
    await teacher.save();

    student.bookingRequests = student.bookingRequests.filter(
        (booking) => booking._id.toString() !== sessionId
    );
    student.rejectedRequests.push(sessionId);
    await student.save();
    

    return res.status(200).json({
        success : true,
        session, 
        message: "Booking request rejected successfully" 
    });
  } catch (error) {
    console.error("Error rejecting session:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getTeacherBookedSessions = async (req, res) => {
  try {
      const teacherId = req.user.id;
      const teacher = await Teacher.findOne({ accountDetails: teacherId });
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      const bookedSessions = await Session.find({ teacher: teacher._id, status: "Approved" }).populate({
        path: "student",
        populate: {
          path: "accountDetails",
          select: "-password",
        },
        select: "-bookedSlots -bookingRequests -rejectedRequests -cancelledRequests",
      });

      return res.status(200).json({ bookedSessions });
  } catch (error) {
    console.error("Error fetching booked sessions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const {formData} = req.body;
    const newData = JSON.parse(formData);
    const { name, email, password, subjectSpecialization, experience, educationQualification} = newData;
    const teacherId = req.user.id;
    const teacher = await Teacher.findOne({ accountDetails: teacherId }).populate({
      path: "accountDetails",
      select: "-password",
    });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    if(subjectSpecialization){
      teacher.subjectSpecialization = subjectSpecialization;
    }
    if(experience){
      teacher.experience = experience;
    }
    if(educationQualification){
    teacher.educationQualification = educationQualification;}
    const accountInfo = await User.findById(teacherId);
    if(name){
      accountInfo.name = name;
    }
    if(email){
      accountInfo.email = email;
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      accountInfo.password = hashedPassword;
    }
    if(accountInfo.needProfileUpdate){
      accountInfo.needProfileUpdate = false;
    }
    
    const files = req.files;
    console.log(files);

    if(files){
      const imageFile = req.files.file;
      console.log(imageFile);
      const imageFileName = `${teacherId}_file_${Date.now()}`;
      const fileExtension = imageFile.name.split('.').pop().toLowerCase();
      console.log(fileExtension);

      if(fileExtension === "jpg" || fileExtension === "jpeg" || fileExtension === "png"){
        const options = {
          folder : "profilePics",
          public_id : imageFileName,
        }
        const response = await cloudinary.v2.uploader.upload(imageFile.tempFilePath, options);
        accountInfo.profilePic = response.secure_url;
    }
    else{
      return res.status(400).json({message : "Invalid file format"});
    }
  }
    
    await teacher.save();
    await accountInfo.save();
    const updatedTeacher = {
      educationQualification: teacher.educationQualification,
      subjectSpecialization: teacher.subjectSpecialization,
      experience: teacher.experience,
      profilePic : accountInfo.profilePic,
    }
    return res.status(200).json({
      success : true,
      message: "Teacher profile updated successfully",
      teacher,
      updatedTeacher
    })

  } catch (error) {
    console.error("Error updating teacher profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAllBookingRequests = async (req, res) => {
  try{
    const teacherId = req.user.id;
    const teacher = await Teacher.findOne({accountDetails : teacherId}).populate({path: "bookingRequests",
    populate : {
      path : "student",
      select : "-bookedSlots -bookingRequests -rejectedRequests",
      populate : {
        path : "accountDetails",
        select : "-password"
      }
    }})
    if(!teacher){
      return res.status(404).json({ message: "Teacher not found" });
    }
    return res.status(200).json({ bookingRequests: teacher.bookingRequests });
  }
  catch(error){
    console.error("Error getting all booking requests:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
  }

  const cancelledRequests = async (req, res) => {
    try{
      const teacherId = req.user.id;
      const teacher = await Teacher.findOne({accountDetails : teacherId}).populate({
        path : "cancelledRequests",
        populate : {
          path : "student",
          select : "-bookedSlots -bookingRequests -rejectedRequests",
          populate : {
            path : "accountDetails",
            select : "-password"
          }
        }
      })
      return res.status(200).json({ cancelledRequests : teacher.cancelledRequests });
    }
    catch(error){
      console.error("Error getting all booking requests:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }


export { approveSession,cancelledRequests, rejectSession, getTeacherBookedSessions, updateProfile,getAllBookingRequests };
