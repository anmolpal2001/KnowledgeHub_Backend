import cloudinary from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

const connectCloudinary = () => {
    try{
        cloudinary.v2.config({
            cloud_name: process.env.CLOUD_NAME,
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        })
        console.log("Cloudinary connected successfully");
    }
    catch(error){
        console.log(error);
        process.exit(1);
    }
}


export default connectCloudinary;