const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./conn.js");
const cors = require("cors");

dotenv.config();

connectDB();

const app = express();

const corsOptions = {
  origin: ["http://localhost:3000"],
  optionsSuccessStatus: 200,
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());

const userRouter = require("./routes/userRoute.js");

app.use("/api/user", userRouter);

const PORT = process.env.PORT || 8080;

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

const server = app.listen(PORT, () => {
  console.log(
    `Server Running on ${process.env.DEV_MODE} mode on port ${PORT}`
  );
});
