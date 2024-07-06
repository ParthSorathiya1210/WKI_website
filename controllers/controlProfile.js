const Profile = require("../models/profileSchema");
const bcrypt = require("bcrypt");
const cloudinary = require("cloudinary").v2;
const jwt = require("jsonwebtoken");
const { isAdmin } = require("../middleware/authorization");
require("dotenv").config();

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

exports.showProfile = async (req, res) => {
    try {
        let user = req.user;
        const email = user.email;

        const profile = await Profile.findOne({ email });

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const { isLoggedIn, isAdmin } = navneed(req);
        res.render("profile.ejs", { profile, isLoggedIn, userRole: isAdmin });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: "Error while showing profile",
            error: err.message
        });
    }
};

function validFileType(fileType, supportedFileTypes) {
    return supportedFileTypes.includes(fileType);
}

async function uploadFileToCloudinary(file, folder) {
    const options = { resource_type: "image", folder };
    return cloudinary.uploader.upload(file.tempFilePath, options);
}

exports.signUp = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const { isLoggedIn, isAdmin } = navneed(req);
        const file = req.files && req.files.file;

        const existingUser = await Profile.findOne({ email });
        if (existingUser) {
            // Redirect to existing profile
            return res.redirect(`/waterking/v1/login?message=Already%20account%20exist&email=${email}`);
        }

        let hashedPassword;
        try {
            hashedPassword = await bcrypt.hash(password, 10);
        } catch (err) {
            return res.status(500).json({
                success: false,
                message: "error in hashing password"
            });
        }

        let image_url;
        if (file) {
            const fileType = file.name.split(".")[1].toLowerCase();
            const supportedFileTypes = ["jpeg", "jpg", "png"];
            if (!validFileType(fileType, supportedFileTypes)) {
                // return res.status(400).json({
                //     success: false,
                //     message: "file format not supported"
                // });
                return res.render("signup.ejs", { name, email, message: "file format not supported.", isLoggedIn, userRole: isAdmin });
            }
            const response = await uploadFileToCloudinary(file, "MediaDB");
            image_url = response.secure_url;
        }
        else {
            image_url = "https://res.cloudinary.com/db84tbjky/image/upload/v1715580859/MediaDB/user_asrhse.png";
        }
        const profile = await Profile.create({ name, email, password: hashedPassword, role, image_url });
        res.render('profile.ejs', { profile, isLoggedIn, userRole: isAdmin });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: "error while signing up",
            error: err.message
        });
    }
};


exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        let user = await Profile.findOne({ email });
        if (!user) {
            // res.status(404).json({
            //     success: false,
            //     message: "user not found"
            // });
            const { isLoggedIn, isAdmin } = navneed(req);
            return res.render("login.ejs", { email: '', password: '', message: "User not found", isLoggedIn, userRole: isAdmin });
        }

        if (!await bcrypt.compare(password, user.password)) {
            // res.status(400).json({
            //     success:false,
            //     message:"password does not match"
            // });
            const { isLoggedIn, isAdmin } = navneed(req);
            return res.render("login.ejs", { email: email, password: '', message: "Please enter correct password", isLoggedIn, userRole: isAdmin });
        }

        const payload = {
            email: user.email,
            password: user.password,
            role: user.role
        };

        let token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

        user = user.toObject();
        user.token = token;
        user.password = undefined;

        const options = {
            expires: new Date(Date.now() + 3000 * 1000),
            //1*24*60*60*
            httpOnly: true
        }

        res.cookie("token", token, options);

        // req.session.isLoggedIn = true;
        // if (user.role === "Admin") {
        //     req.session.userRole = true;
        // }
        res.redirect("home");
        // .status(200).json({
        //     success:true,
        //     user,
        //     token,
        //     message:"user logged in successfully"
        // });

    }
    catch (err) {
        console.log(err);
        res.status(401).json({
            success: false,
            message: "user login failed"
        });
    }
};

exports.logout = (req, res) => {
    res.clearCookie("token");
    res.redirect("/waterking/v1/login");
};

function extractPublicId(url) {
    const urlSegments = url.split('/');
    const index = urlSegments.indexOf('upload');
    if (index === -1) {
        throw new Error('Invalid Cloudinary URL');
    }
    const publicIdSegments = urlSegments.slice(index + 2);
    const publicIdWithExtension = publicIdSegments.join('/');
    const publicId = publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));
    return publicId;
}

exports.updateUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        console.log({ name, email, password, role });
        const file = req.files && req.files.file;

        // Find user by email to get the ID and current image URL
        const user = await Profile.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const id = user._id;
        const currentImageUrl = user.image_url;
        console.log(user);

        // Update the profile object
        const updatedProfile = { name, email, role };
        if (password) {
            try {
                updatedProfile.password = await bcrypt.hash(password, 10);
            } catch (err) {
                return res.status(500).json({
                    success: false,
                    message: "Error in hashing password"
                });
            }
        }

        // Handle file upload if present
        if (file) {
            const fileType = file.name.split(".").pop().toLowerCase();
            const supportedFileTypes = ["jpeg", "jpg", "png"];
            if (!validFileType(fileType, supportedFileTypes)) {
                const { isLoggedIn, isAdmin } = navneed(req);
                return res.render("updateUser.ejs", { name, email, message: "File format not supported.", password, role, isLoggedIn, userRole: isAdmin });
            }

            const response = await uploadFileToCloudinary(file, "MediaDB");
            updatedProfile.image_url = response.secure_url;

            if (currentImageUrl && currentImageUrl !== "https://res.cloudinary.com/db84tbjky/image/upload/v1715580859/MediaDB/user_asrhse.png") {
                const publicId = extractPublicId(currentImageUrl);
                await cloudinary.uploader.destroy(publicId);
            }
        }

        // Update user profile in the database
        await Profile.findByIdAndUpdate(id, updatedProfile, { new: true });

        const { isLoggedIn, isAdmin } = navneed(req);
        res.render('error.ejs', { message: "Profile updated successfully", userRole: isAdmin, isLoggedIn });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: "Error while editing profile",
            error: err.message
        });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const token = req.cookies.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { email } = decoded;
        const user = await Profile.findOneAndDelete({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Delete user's photo from Cloudinary if it exists
        const imageUrl = user.image_url;
        if (imageUrl && imageUrl !== "https://res.cloudinary.com/db84tbjky/image/upload/v1715580859/MediaDB/user_asrhse.png") {
            const publicId = extractPublicId(imageUrl);
            await cloudinary.uploader.destroy(publicId);
        }

        //logout
        res.clearCookie('token');

        const { isLoggedIn, isAdmin } = navneed(req);
        res.render('error.ejs', { message: "User deleted successfully", userRole: isAdmin, isLoggedIn });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Error deleting profile", error: err.message });
    }
};
