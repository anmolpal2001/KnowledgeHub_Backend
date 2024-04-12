import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const mailSender = async (email, title, body) => {
    console.log(email);
    try{
        let transporter = nodemailer.createTransport({
            host : process.env.MAIL_HOST,
            port :  587,
            secure : false,
            auth : {
                user : process.env.MAIL_USERNAME,
                pass : process.env.MAIL_PASSWORD,
            },
        });

        let info = await transporter.sendMail({
            from : 'KnowledgeHub <heyyahoo143@gmail.com>',
            to : `${email}`,
            subject : `${title}`,
            html : `${body}`,
        });
        return info;
    }
    catch(error){
        console.log(error.message);
    }
}

export default mailSender;