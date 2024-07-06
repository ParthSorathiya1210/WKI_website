const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.auth = (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            // return res.status(401).json({
            //     success: false,
            //     message: "token not found"
            // });

            return res.redirect("/waterking/v1/login?message=please%20login%20first");
        }

        try {
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decode;
            // console.log(req.user);
        }
        catch (err) {
            return res.status(401).json({
                success: false,
                message: "token validation failed"
            });
        }

        next();
    }
    catch (err) {
        return res.status(401).json({
            success: false,
            message: "something went wrong"
        });
    }
};

exports.isAdmin = (req, res, next) => {
    try {
        if (req.user.role !== "Admin") {
            // return res.status(401).json({
            //     success: false,
            //     message: "this is only for Admin"
            // });
            return res.render("error.ejs",{message:"this is only for admin"});
        }

        next();
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: "something went wrong"
        });
    }
};

exports.isUser = (req, res, next) => {
    try {
        if (req.user.role !== "User") {
            return res.status(401).json({
                success: false,
                message: "this is only for User"
            });
        }

        next();
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: "something went wrong"
        });
    }
};