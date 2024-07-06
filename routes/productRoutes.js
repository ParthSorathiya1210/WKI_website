const express = require("express");
const router = express.Router();

const jwt = require("jsonwebtoken");
require("dotenv").config;
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

const { auth, isAdmin, isUser } = require("../middleware/authorization");
const Product = require("../models/productSchema");

const { showProducts, productSpecific, addProduct, deleteProduct, updateProduct, findProduct } = require("../controllers/controlProduct");
router.get("/products", showProducts);
router.get("/products/:id", productSpecific);

router.get("/addProduct", auth, isAdmin, (req, res) => {
    const { isLoggedIn, isAdmin } = navneed(req);
    const { name, model_no, price, type, height, power_source, frequency, voltageLow, voltageHigh, brand, horsePower, phase, material, packagingType, description, message } = req.body;
    res.render("productForm.ejs", { name, model_no, price, type, height, power_source, frequency, voltageLow, voltageHigh, brand, horsePower, phase, material, packagingType, description, message, userRole: isAdmin, isLoggedIn });
});
router.post("/addProduct", addProduct);

router.get("/products/del_product/:id", auth, isAdmin, (req, res) => {
    const { id } = req.params;
    res.render("deleteProduct.ejs", { isLoggedIn: true, userRole: true, productId: id });
});
router.post("/products/del_product/:id", auth, isAdmin, deleteProduct);

router.get("/products/update_product/:id", auth, isAdmin, findProduct);
router.post("/products/update_product/:id", auth, isAdmin, updateProduct);

module.exports = router;