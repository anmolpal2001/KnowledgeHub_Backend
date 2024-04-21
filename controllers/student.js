import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import Session from "../models/Session.js";
import mailSender from "../mail/mailSender.js";
import { sessionRequestEmail } from "../mail/templates/sessionRequestEmail.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import cloudinary from 'cloudinary';

const getStudentInfo = async (req, res) => {
  try {
    const studentId = req.user.id; // Assuming the authenticated user's id is available in req.user.id
    const student = await Student.findById({ accountDetails: studentId });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.status(200).json({ student: student });
  } catch (error) {
    console.error("Error fetching student info:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const bookSession = async (req, res) => {
  try {
    const { teacherId, date, startTime, endTime, subject, description } =
      req.body;
    const studentId = req.user.id;
    console.log(subject, description);

    const student = await Student.findOne({ accountDetails: studentId }).populate('accountDetails');;
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    console.log(student);

    const teacher = await Teacher.findOne({ accountDetails: teacherId }).populate('accountDetails');
    console.log(teacher);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const session = new Session({
      student: student._id,
      teacher: teacher._id,
      date: date,
      slot: {
        start: startTime,
        end: endTime,
      },
    });

    await session.save();

    student.bookingRequests.push(session._id); 
    await student.save();

    // Add the session to the teacher's bookingRequests array
    teacher.bookingRequests.push(session._id); // Only store session ID
    await teacher.save();

    const emailResponse = await mailSender(teacher.accountDetails.email, "New Session Request", sessionRequestEmail(student.accountDetails.email,student.accountDetails.fullname, teacher.accountDetails.email,teacher.accountDetails.fullname, date, `${startTime} - ${endTime}`, subject, description));
    // console.log("Email Response ", emailResponse);



    res
      .status(201)
      .json({
        message: "Booking request created successfully",
        session: session,
      });
  } catch (error) {
    console.error("Error booking session:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getbookedSessions = async (req, res) => {
  try {
    const studentId = req.user.id; // Assuming the authenticated user's id is available in req.user.id
    const student = await Student.findOne({ accountDetails: studentId });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    const bookedSessions = await Session.find({
      _id: { $in: student.bookedSlots },
      status: "Approved",
    }).populate({
      path: "teacher",
      populate: {
        path: "accountDetails",
        select: "-password",
      },
      select: "-bookingRequests -acceptedBookings -cancelledRequests -availability",
    });
    res.status(200).json({ bookedSessions: bookedSessions });
  } catch (error) {
    console.error("Error fetching booked sessions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAvailableSlots = async (req, res) => {
  try {
    // get the teacher id, day from the request body
    const { teacherId, date } = req.body;
    // find the teacher by id
    const teacher = await Teacher.findById(teacherId);
    // find the day in the teacher's schedule
    const scheduleforDate = teacher.availability.find(
      (date) => date.date === date
    );
    if (!scheduleforDate) {
      return res
        .status(400)
        .json({ message: "No slots available for this day" });
    }
    const availableSlots = scheduleforDate.slots.filter(
      (slot) => slot.status !== "Booked"
    );
    return res.status(200).json({ slots: availableSlots });

    // return the slots array
  } catch (error) {}
};

const sessionRequestList = async (req, res) => {
  try {
    //get the student id from the request body
    const studentId = req.user.id;
    //find the student by id
    const student = await Student.findOne({
      accountDetails: studentId,
    }).populate({
      path : "bookingRequests",
      populate : {
        path : "teacher",
        populate : {
          path : "accountDetails",
          select : "-password",
        },
        select : "-bookingRequests -acceptedBookings -cancelledRequests -availability",
      }
    });
    //return the bookingRequests array
    return res.status(200).json({ bookingRequests: student.bookingRequests });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const cancelSession = async (req, res) => {
  try {
    // get the student id, teacher id, day, slot time from the request body
    const { sessionId } = req.body;
    // find the student by id
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    const student = await Student.findById(session.student);
    const teacher = await Teacher.findById(session.teacher);

    student.bookingRequests = student.bookingRequests.filter(
      (booking) => booking._id.toString() !== sessionId
    );
    await student.save();

    teacher.bookingRequests = teacher.bookingRequests.filter(
      (booking) => booking._id.toString() !== sessionId
    );
    await teacher.save();

    await Session.deleteOne({ _id: sessionId });

    // send a success message
    return res
      .status(200)
      .json({ message: "Booking request cancelled successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const {formData} = req.body;
    const newData = JSON.parse(formData);
    const { highestQualification, name, email, password } = newData;
    const studentId = req.user.id;
    const student = await Student.findOne({ accountDetails: studentId }).populate({
      path : "accountDetails",
      select : "-password",
    });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
   if(highestQualification){
    student.highestQualification = highestQualification;
   }
    const accountInfo = await User.findById(studentId);
    if(accountInfo.needProfileUpdate){
      accountInfo.needProfileUpdate = false;
    }
    if(name){
      accountInfo.name = name;
    }
    if(email){
      accountInfo.email = email;
    }
    if(password){
      const hashedPassword = await bcrypt.hash(password, 10);
      accountInfo.password = hashedPassword;
    }
    
    const files = req.files;
    console.log(files);

    if(files){
      const imageFile = req.files.file;
      console.log(imageFile);
      const imageFileName = `${studentId}_file_${Date.now()}`;
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


    await student.save();
    await accountInfo.save();
    const updatedStudent = {
      highestQualification : highestQualification ? highestQualification : student.highestQualification,
      profilePic : accountInfo.profilePic,
    }
    return res.status(200).json({ message: "Profile updated successfully", updatedStudent });

  } catch (error) {
    console.error("Error updating student profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .populate({
        path: "accountDetails",
        select: "-password", // Exclude password field from accountDetails
      })
      .select(
        "-bookingRequests -acceptedBookings -cancelledRequests"
      );
    res.status(200).json({ teachers });
  } catch (error) {
    console.error("Error getting all teachers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const rejectedRequestsList = async (req, res) => {
  try{
    const studentId = req.user.id;
    const student = await Student.findOne({ accountDetails: studentId }).populate({
      path : "rejectedRequests",
      populate : {
        path : "teacher",
        populate : {
          path : "accountDetails",
          select : "-password",
        },
        select : "-bookingRequests -acceptedBookings -cancelledRequests",
      }
    });

    return res.status(200).json({ rejectedRequests: student.rejectedRequests });
  }
  catch(error){
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export {
  bookSession,
  getbookedSessions,
  getAvailableSlots,
  sessionRequestList,
  cancelSession,
  updateProfile,
  getStudentInfo,
  getAllTeachers,
  rejectedRequestsList,
};
