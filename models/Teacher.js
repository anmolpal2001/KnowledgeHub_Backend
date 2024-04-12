import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
  {
    accountDetails: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    educationQualification: {
      type: String,
    },
    subjectSpecialization: {
      type: String,
    },
    experience: {
      type: String,
    },
    cancelledRequests: [
      {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Session",
      },
    ],
    bookingRequests: [
      {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Session",
      },
    ],
    acceptedBookings: [
      {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Session",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Teacher = mongoose.model("Teacher", teacherSchema);

export default Teacher;
