const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL, { dbName: "Kudos" });
    console.log(
      `Connected To MongoDB Database ${conn.connection.host}`
    );
  } catch (error) {
    console.log(`Error in MongoDB ${error}`);
  }
};

module.exports = connectDB;
