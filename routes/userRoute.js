const express = require("express");
const {
  signup,
  verifyOTP,
  signin,
  getResume,
  postResume,
  verifyToken,
  getAllResumes,
} = require("../controllers/userController.js");

const router = express.Router();

router.post("/SignUp", signup);
router.post("/verify-otp", verifyOTP);
router.post("/SignIn", signin);
router.get("/Resume", verifyToken, getResume);
router.post("/Resume", verifyToken, postResume);
router.get("/AllResumes", getAllResumes);

module.exports = router;
