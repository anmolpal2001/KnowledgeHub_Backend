import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import mailSender from "../mail/mailSender.js";
import { userRegisteredEmail } from "../mail/templates/userRegisteredEmail.js";
import { forgotPasswordEmail } from "../mail/templates/forgotPasswordEmail.js";
dotenv.config();

const registerUser = async (req, res) => {
  try {
    // get user data
    const { fullname, email, password, accountType } = req.body;

    // check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // secure password
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Password encryption failed",
      });
    }
    if (accountType !== "Student" && accountType !== "Teacher") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid account type. Account type must be 'Student' or 'Teacher'.",
      });
    }

    // create new user
    const newUser = new User({
      fullname,
      email,
      password: hashedPassword,
      accountType,
      needProfileUpdate: true,
    });

    // save user
    const savedUser = await newUser.save();
    console.log("User registered successfully");

    if (accountType === "Student") {
      const newStudent = new Student({
        accountDetails: savedUser._id,
      });
      await newStudent.save();
    } else if (accountType === "Teacher") {
      const newTeacher = new Teacher({
        accountDetails: savedUser._id,
      });
      await newTeacher.save();
    }
    const emailResponse = await mailSender(
      email,
      "Welcome to Knowledge Hub",
      userRegisteredEmail(fullname)
    );

    // send response
    res.status(200).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: savedUser,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "User cannot be registered, please try again later",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all the details carefully",
      });
    }

    let user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const payload = {
      email: user.email,
      id: user._id,
      accountType: user.accountType,
    };
    if (await bcrypt.compare(password, user.password)) {
      let token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "2h",
      });

      user = user.toObject();

      user.token = token;
      user.password = undefined;
      // console.log(user);
      const options = {
        expires: new Date(Date.now() + 1000 * 60 * 60 * 2),
        httpOnly: true,
      };
      if (user.accountType === "Student") {
        const student = await Student.findOne({ accountDetails: user._id });
        const highestQualification = student.highestQualification;
        user = { ...user, highestQualification };
      } else if (user.accountType === "Teacher") {
        const teacher = await Teacher.findOne({ accountDetails: user._id });
        const educationQualification = teacher.educationQualification;
        const experience = teacher.experience;
        const subjectSpecialization = teacher.subjectSpecialization;
        user = {
          ...user,
          educationQualification,
          experience,
          subjectSpecialization,
        };
      }

      console.log(user);

      res.cookie("token", token, options).status(200).json({
        success: true,
        user,
        token,
        message: "User logged in successfully",
      });
    } else {
      return res.status(403).json({
        success: false,
        message: "Password is incorrect",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Login failed, please try again later",
    });
  }
};

const logoutUser = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({
      success: true,
      message: "Logout Successfully, Thanks for visiting...",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Logout failed, please try again",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const validUser = await User.findOne({ email });
    if (!validUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const payload = {
      id: validUser._id,
      email: email,
    };

    const token = jwt.sign(payload, process.env.CHANGE_PASSWORD_SECRET, {
      expiresIn: "5m",
    });

    const linkForChangePassword = `${process.env.CLIENT_URL}/reset-password/${validUser._id}/${token}`;

    const emailResponse = await mailSender(
      email,
      "Resetting your KnowledgeHub password",
      forgotPasswordEmail(validUser.fullname, linkForChangePassword)
    );

    return res.status(200).json({
      success: true,
      linkForChangePassword,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { id, token } = req.params;
    const { newPassword, confirmNewPassword } = req.body;

    const validUser = await User.findById(id);
    if (!validUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const payload = jwt.verify(token, process.env.CHANGE_PASSWORD_SECRET);

    if (!payload) {
      return res.status(400).json({
        success: false,
        message: "Link is invalid or expired",
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and Confirm Password does not match",
      });
    }
    const hashedpassword = await bcrypt.hash(newPassword, 10);
    validUser.password = hashedpassword;
    await validUser.save();

    return res.status(200).json({
      success: true,
      message: "Password has been changed successfully",
    });
  } catch (error) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error while changing password, please try again",
    });
  }
};

export { registerUser, loginUser, logoutUser, forgotPassword,changePassword };
