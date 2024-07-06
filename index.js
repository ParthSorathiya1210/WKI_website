const express = require("express");
const db = require("./config/database");
const bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
const cloudinary = require("./config/cloudinary");
const fileUpload = require('express-fileupload');
// const session = require('express-session');

const app = express();

require("dotenv").config();
const PORT = process.env.PORT || 4000;

app.use(express.json());
db.dbConnect();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());

cloudinary.cloudinaryConnect();

app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/'
}));
app.use(express.static('public'));

// // Set up session middleware
// app.use(session({
//     secret: process.env.JWT_SECRET, //here we should use any other key but due to lassyness i have used existing secret
//     resave: false,
//     saveUninitialized: true,
// }));

// // Middleware to check if user is logged in
// app.use((req, res, next) => {
//     res.locals.isLoggedIn = req.session.isLoggedIn || false;
//     res.locals.userRole = req.session.userRole || false;
//     next();
// });

const profileRoutes = require("./routes/profileRoutes");
const productRoutes = require("./routes/productRoutes");
const route = require("./routes/routes");

app.use("/waterking/v1", profileRoutes);
app.use("/waterking/v1", productRoutes);
app.use("/waterking/v1", route);

app.listen(PORT, () => {
    console.log(`server is running on PORT ${PORT} successfully`);
});