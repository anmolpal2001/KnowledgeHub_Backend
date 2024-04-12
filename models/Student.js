import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    accountDetails: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    highestQualification: {
      type: String,
    },
    bookedSlots: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session",
      },
    ],
    bookingRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session",
      },
    ],
    rejectedRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Student = mongoose.model("Student", studentSchema);

export default Student;
