const mongoose = require("mongoose");

require("dotenv").config();
const DATABASE_URL = process.env.DATABASE_URL;

const dbConnect = async (req,res) => {
    mongoose.connect(DATABASE_URL)
    .then(() => {
        console.log("database connection successfully.");
    })
    .catch((err) => {
        console.error(err);
        console.log("db connection failed");
        process.exit(1);
    });
};

module.exports = {dbConnect};