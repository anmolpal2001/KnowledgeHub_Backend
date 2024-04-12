import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import authRoutes from "./routes/auth.js";
import cookieParser from "cookie-parser";
import studentRoutes from "./routes/student.js";
import teacherRoutes from "./routes/teacher.js";
import cors from "cors";
// import path from "path";
dotenv.config();
const app = express();

// const __dirname = path.resolve();

// if (process.env.NODE_ENV !== "production") {
//   app.use(express.static(path.join(__dirname, "client", "dist")));
//   app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
//   });
// }
app.use(cors());
app.use(express.json());
app.use(cookieParser());
const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/student", studentRoutes);
app.use("/api/v1/teacher", teacherRoutes);

connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
