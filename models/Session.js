import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    student : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Student",
    },
    teacher : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Teacher",
    },
    date : {
        type : Date,
        required : true,
    },
    slot : {
        start : {
            type : String,
            required : true,
        },
        end : {
            type : String,
            required : true,
        }
    },
    status : {
        type : String,
        enum : ["Pending", "Approved", "Rejected"],
        default : "Pending",
    }
},
{
    timestamps : true,
}
);

const Session = mongoose.model("Session", sessionSchema);

export default Session;