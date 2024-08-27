const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const errorHandler = require("../utils/error");
const { User } = require("../models/userModel");
const { sendOTPEmail } = require("../utils/otpHandler");
const { generateOTP } = require("../utils/otpHandler");

const OTP_EXPIRATION_TIME = 5 * 60 * 1000;

async function deleteUsersWithExpiredOTP() {
  try {
    const currentTime = Date.now();
    await User.deleteMany({
      "otp.expirationTime": { $lte: currentTime },
      "otp.code": { $ne: null },
    });
  } catch (error) {
    console.error("Error deleting users with expired OTP:", error);
  }
}

setInterval(deleteUsersWithExpiredOTP, 60 * 1000);

const signin = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email) return next(errorHandler(404, "Email is required!"));
  try {
    const validUser = await User.findOne({ email });
    if (!validUser) return next(errorHandler(404, "User not found!"));
    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) return next(errorHandler(401, "Wrong credentials!"));
    const token = jwt.sign({ id: validUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    const { password: pass, ...rest } = validUser._doc;
    res.status(200).json({ token, user: rest });
  } catch (error) {
    next(error);
  }
};

const signup = async (req, res, next) => {
  const { username, email, password } = req.body;
  if (!email) return next(errorHandler(404, "Email is required!"));
  if (!username) return next(errorHandler(404, "Username is required!"));
  if (!password) return next(errorHandler(404, "Password is required!"));

  const otp = generateOTP();

  const hashedPassword = bcryptjs.hashSync(password, 10);
  const newUser = new User({
    username,
    email,
    password: hashedPassword,
    otp: {
      code: otp,
      expirationTime: Date.now() + OTP_EXPIRATION_TIME,
    },
  });

  try {
    await newUser.save();

    await sendOTPEmail(email, otp);
    res
      .status(201)
      .json(
        "User created successfully! Please check your email for OTP verification."
      );
  } catch (error) {
    next(error);
  }
};

const verifyOTP = async (req, res, next) => {
  const { email, otp } = req.body;
  console.log(otp);
  if (!email) return next(errorHandler(404, "Email is required!"));
  if (!otp) return next(errorHandler(404, "OTP is required!"));

  try {
    const user = await User.findOne({ email });
    if (!user) return next(errorHandler(404, "User not found!"));
    if (!user.otp || !user.otp.code) {
      return res.status(400).json({ error: "OTP already Verified" });
    }

    if (!user.otp || req.body.otp !== user.otp.code) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (Date.now() > user.otp.expirationTime) {
      return res.status(400).json({ error: "OTP has expired" });
    }

    user.otp.code = null;
    user.otp.expirationTime = null;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({ token, user: user });
  } catch (error) {
    next(error);
  }
};

// Get token from header and verify
const verifyToken = async (req, res, next) => {
  const token = req.header("Token");
  if (!token) return next(errorHandler(401, "Unauthorized!"));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    next(errorHandler(401, "Unauthorized!"));
  }
};

// Get Resume and Update Resume functions
const getResume = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return next(errorHandler(404, "User not found!"));
    res.status(200).json({ resume: user.resume });
  }
  catch (error) {
    next(error);
  }
}

const postResume = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return next(errorHandler(404, "User not found!"));
    user.resume = req.body.resume;
    await user.save();
    res.status(200).json({ resume: user.resume,success: true });
  }
  catch (error) {
    next(error);
  }
}

const getAllResumes = async (req, res, next) => {
  try {
    const users = await User.find({}, { username: 1, resume: 1 });
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  verifyOTP,
  signin,
  verifyToken,
  getResume,
  postResume,
  getAllResumes,
};
