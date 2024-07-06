const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { auth } = require("../middleware/authorization");
const Product = require("../models/productSchema");
require("dotenv").config();

function navneed (req) {
    const token = req.cookies.token;
    let isLoggedIn = false;
    let isAdmin = false;

    if (token) {
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decode;
        isLoggedIn = true;
        if (req.user.role === "Admin") {
            isAdmin = true;
        }
    }

    return { isLoggedIn, isAdmin };
}

router.get("/home", async (req, res) => {
    const { isLoggedIn, isAdmin } = navneed(req);
    const productsOpenWell = await Product.find({ type: "Openwell" });
    const productsBorewell = await Product.find({ type: "Borewell" });
    res.render("home.ejs", { userRole:isAdmin, isLoggedIn, productsOpenWell,productsBorewell });
});

router.get("/about", (req, res) => {
    const { isLoggedIn, isAdmin } = navneed(req);
    res.render("aboutUs.ejs", { userRole:isAdmin, isLoggedIn });
});

router.get("/quality", (req, res) => {
    const { isLoggedIn, isAdmin } = navneed(req);
    res.render("quality.ejs", { userRole:isAdmin, isLoggedIn });
});

router.get("/contact", auth, (req, res) => {
    const { isLoggedIn, isAdmin } = navneed(req);
    res.render("contactUs.ejs", { userRole:isAdmin, isLoggedIn });
});

router.get("/team", (req, res) => {
    const { isLoggedIn, isAdmin } = navneed(req);
    res.render("team.ejs", { userRole:isAdmin, isLoggedIn });
});

router.get("/me", (req, res) => {
    const { isLoggedIn, isAdmin } = navneed(req);
    res.render("me.ejs", { userRole:isAdmin, isLoggedIn });
});

module.exports = router,{navneed};