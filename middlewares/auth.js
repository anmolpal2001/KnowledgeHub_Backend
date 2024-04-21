import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const auth = async (req, res, next) => {
    try{
        const token = req.body.token || req.cookies.token || (req.headers.authorization && req.headers.authorization.split(" ")[1]);
        if(!token || token == undefined || token == "")
        {
            return res.status(401).json({
                success : false,
                message : "Token missing",
            })
        }

        try{
            const payload = jwt.verify(token,process.env.JWT_SECRET);
            req.user = payload;
        }
        catch(error)
        {
            return res.status(401).json({
                success : false,
                message : "Invalid token",
            })
        }
        next();
    }
    catch(error)
    {
        console.error(error);
        return res.status(401).json({
            success : false,
            message : "Something went wrong, while verifying token",
        })
    }
}

const isStudent = (req,res,next) => {
    try{
        if(req.user.accountType !== "Student")
        {
            return res.status(401).json({
                success : false,
                message : "You are not authorized to access this route, This is a protected route for students",
            })
        }
        next();
    }
    catch(error)
    {
        console.error(error);
        return res.status(500).json({
            success : false,
            message : "User role is not matching",
        })
    }
}

const isTeacher = (req,res,next) => {
    try{
        if(req.user.accountType !== "Teacher")
        {
            return res.status(401).json({
                success : false,
                message : "You are not authorized to access this route, This is a protected route for Teachers",
            })
        }
        next();
    }
    catch(error)
    {
        console.error(error);
        return res.status(500).json({
            success : false,
            message : "User role is not matching",
        })
    }
}

export {auth,isStudent,isTeacher};