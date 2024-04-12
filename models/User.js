import mongoose from "mongoose";

let profile_imgs_name_list = ["Garfield", "Tinkerbell", "Annie", "Loki", "Cleo", "Angel", "Bob", "Mia", "Coco", "Gracie", "Bear", "Bella", "Abby", "Harley", "Cali", "Leo", "Luna", "Jack", "Felix", "Kiki"];
let profile_imgs_collections_list = ["notionists-neutral", "adventurer-neutral", "fun-emoji"];


const userSchema = new mongoose.Schema({
    fullname : {
        type: String,
        required: true,
        trim : true
    },
    email : {
        type: String,
        required: true,
        unique: true,
        trim : true
    },
    password : {
        type: String,
        required: true
    },
    accountType : {
        type: String,
        required: true,
        enum : ["Student","Teacher"],
        default : "student"
    },
    profilePic : {
        type: String,
        default: () => {
            return `https://api.dicebear.com/6.x/${profile_imgs_collections_list[Math.floor(Math.random() * profile_imgs_collections_list.length)]}/svg?seed=${profile_imgs_name_list[Math.floor(Math.random() * profile_imgs_name_list.length)]}`
        }
    },
    needProfileUpdate : {
        type: Boolean,
        default: false
    },
},{
    timestamps : true
})

const User = mongoose.model("User",userSchema);

export default User;