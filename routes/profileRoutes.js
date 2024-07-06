const express = require("express");
const { auth, isAdmin } = require("../middleware/authorization");
const Profile = require("../models/profileSchema");
const router = express.Router();

const jwt = require("jsonwebtoken");
function navneed(req) {
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

const { signUp, showProfile, login, logout, updateUser, deleteUser } = require("../controllers/controlProfile");

router.get("/signup", (req, res) => {
    const { isLoggedIn, isAdmin } = navneed(req);
    const { name, email, message } = req.body;
    res.render("signUp.ejs", { name, email, message, userRole: isAdmin, isLoggedIn });
});

router.get("/login", (req, res) => {
    const { email, message } = req.query;
    const { isLoggedIn, isAdmin } = navneed(req);
    res.render("login.ejs", { email, message, userRole: isAdmin, isLoggedIn });
});

router.get("/profile", auth, showProfile);
router.post("/signup", signUp);
router.post("/login", login);

router.get("/logout", auth, (req, res) => {
    const { isLoggedIn, isAdmin } = navneed(req);
    res.render("logout.ejs", { userRole: isAdmin, isLoggedIn });
});
router.post("/logout", auth, logout);

router.get("/profile/update_user", auth, async (req, res) => {
    const { isLoggedIn, isAdmin } = navneed(req);
    const email = req.user.email;
    const user = await Profile.findOne({ email });
    res.render("updateUser.ejs", { message: "", user, userRole: isAdmin, isLoggedIn });
});
router.post("/profile/update_user", auth, updateUser);

router.get("/profile/del_user", auth, async (req, res) => {
    const { isLoggedIn, isAdmin } = navneed(req);
    res.render("deleteUser.ejs", { userRole: isAdmin, isLoggedIn });
});
router.post("/profile/del_user", auth, deleteUser);

module.exports = router;