
const rejectedSessionLink = `http://localhost:5173/student/rejected-sessions`;

const sessionRejectEmail = (
  studentName,
  teacherEmail,
  teacherName,
  sessionDate,
  sessionTime,
) => {
  return `<!DOCTYPE html>
    <html>
    
    <head>
        <meta charset="UTF-8">
        <title>Contact Form Confirmation</title>
        <style>
            body {
                background-color: #ffffff;
                font-family: Arial, sans-serif;
                font-size: 16px;
                line-height: 1.4;
                color: #333333;
                margin: 0;
                padding: 0;
            }
            h1{
                color: #FFD60A;
                background: #6b6868;
                padding: 10px;
                
            }
    
    
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                text-align: center;
            }
    
            .logo {
                max-width: 200px;
                margin-bottom: 20px;
            }
    
            .message {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 20px;
            }
    
            .body {
                font-size: 16px;
                margin-bottom: 20px;
            }
    
            .cta {
                display: inline-block;
                padding: 10px 20px;
                background-color: #FFD60A;
                color: #000000;
                text-decoration: none;
                border-radius: 5px;
                font-size: 16px;
                font-weight: bold;
                margin-top: 20px;
            }
    
            .support {
                font-size: 14px;
                color: #999999;
                margin-top: 20px;
            }
    
            .highlight {
                font-weight: bold;
            }
        </style>
    
    </head>
    
    <body>
        <div class="container">
            <h1>Knowledge Hub</h1>
            <div class="message">Session Rejections Mail</div>
            <div class="body">
                <p>Dear ${studentName},</p>
                <p>Your session request has been rejected by the teacher.
                </p>
                <p>Here are the details of the teacher for the session :</p>
                <p>Name: ${teacherName}</p>
                <p>Email: ${teacherEmail}</p>
                <p>Date: ${sessionDate}</p>
                <p>Time: ${sessionTime}</p>
                <p>Please review the request and take necessary action.</p>
                <p> You can view the request by logging into your account.</p>
                <p> Go to <a href=${rejectedSessionLink}>Knowledge Hub</a> to review the request.</p>
                <p>Thank you for using our platform.</p>
            </div>
            <div class="support">If you have any further questions or need immediate assistance, please feel free to reach
                out to us at <a href="mailto:info@knowledgehub.com">info@studynotion.com</a>. We are here to help!</div>
        </div>
    </body>
    
    </html>`;
};


export { sessionRejectEmail };