const Product = require("../models/productSchema");
const cloudinary = require("cloudinary").v2;
require('events').EventEmitter.defaultMaxListeners = 20;
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
};

exports.showProducts = async (req, res) => {
    try {
        const productsOpenWell = await Product.find({ type: "Openwell" });
        const productsBorewell = await Product.find({ type: "Borewell" });
        const { isLoggedIn, isAdmin } = navneed(req);
        res.render("product.ejs", { productsOpenWell, productsBorewell, userRole: isAdmin, isLoggedIn });
    }
    catch (err) {
        res.status(400).json({
            success: false,
            message: "product showing issue"
        });
    }
};

exports.productSpecific = async (req, res) => {
    try {
        const { id } = req.params;
        const { isLoggedIn, isAdmin } = navneed(req);
        const product = await Product.findOne({ _id: id });
        if (product.type === "Openwell") {
            const productsOpenWell = await Product.find({ type: "Openwell" });
            return res.render("productOpenwell.ejs", { product, productsOpenWell, userRole: isAdmin, isLoggedIn });
        }
        if (product.type === "Borewell") {
            const productsBorewell = await Product.find({ type: "Borewell" });
            return res.render("productBorewell.ejs", { product, productsBorewell, userRole: isAdmin, isLoggedIn });
        }
    }
    catch (err) {
        res.status(400).json({
            success: false,
            message: "product showing issue"
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

exports.addProduct = async (req, res) => {
    try {
        const { name, model_no, price, type, height, power_source, frequency, voltageLow, voltageHigh, brand, horsePower, phase, material, packagingType, description } = req.body;
        const product = new Product({ name, model_no, price, type, height, power_source, frequency, voltageLow, voltageHigh, brand, horsePower, phase, material, packagingType, description });

        const file = req.files.file;

        const fileType = file.name.split(".")[1].toLowerCase();
        const supportedFileTypes = ["jpeg", "jpg", "png"];
        if (!validFileType(fileType, supportedFileTypes)) {
            const { isLoggedIn, isAdmin } = navneed(req);
            return res.render("productForm.ejs", { name, model_no, price, type, height, power_source, frequency, voltageLow, voltageHigh, brand, horsePower, phase, material, packagingType, description, message: "file format not supported.", userRole: isAdmin, isLoggedIn });
        }

        const response = await uploadFileToCloudinary(file, "MediaDB");
        product.image_url = response.secure_url;
        product.save();
        res.redirect("./products");
    }
    catch (err) {
        res.status(401).json({
            success: false,
            message: "add product failed"
        });
    }
};

exports.findProduct = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).send('Product ID is required');
        }

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).send('Product not found');
        }

        res.render("updateProduct.ejs", {
            isLoggedIn: true,
            userRole: true,
            product,
            productId: id,
            message: ''
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
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

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndDelete({ _id: id });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const publicId = extractPublicId(product.image_url);
        await cloudinary.uploader.destroy(publicId);

        const { isLoggedIn, isAdmin } = navneed(req);
        res.render("error.ejs", { message: `Product ${product.model_no} deleted successfully.`, isLoggedIn, userRole: isAdmin });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "An error occurred while deleting the product"
        });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, model_no, price, type, height, power_source, frequency, voltageLow, voltageHigh, brand, horsePower, phase, material, packagingType, description } = req.body;

        // Find the existing product to get the current image URL
        const existingProduct = await Product.findById(id);
        if (!existingProduct) {
            return res.render('error.ejs', {
                message: `Product ${model_no} not found`,
                isLoggedIn: true,
                userRole: true
            });
        }

        let imageUrl = undefined;
        if (req.files && req.files.file) {
            const file = req.files.file;
            const fileType = file.name.split('.').pop().toLowerCase();
            const supportedFileTypes = ['jpeg', 'jpg', 'png'];
            if (!validFileType(fileType, supportedFileTypes)) {
                return res.render('updateProduct.ejs', {
                    name, model_no, price, type, height, power_source, frequency, voltageLow, voltageHigh, brand, horsePower, phase, material, packagingType, description,
                    message: 'File format not supported.',
                    userRole: true,
                    isLoggedIn: true,
                    productId: id
                });
            }

            // Delete the existing image from Cloudinary if a new image is uploaded
            if (existingProduct.image_url) {
                const publicId = extractPublicId(existingProduct.image_url);
                await cloudinary.uploader.destroy(publicId);
            }

            // Upload the new image to Cloudinary
            const response = await uploadFileToCloudinary(file, 'MediaDB');
            imageUrl = response.secure_url;
        }

        // Update product details
        const updatedProduct = {
            name, model_no, price, type, height, power_source, frequency, voltageLow, voltageHigh, brand, horsePower, phase, material, packagingType, description
        };
        if (imageUrl) {
            updatedProduct.image_url = imageUrl;
        }

        const response = await Product.findByIdAndUpdate(id, updatedProduct, { new: true });

        if (response) {
            res.render('error.ejs', {
                message: `Product ${model_no} updated successfully.`,
                isLoggedIn: true,
                userRole: true
            });
        } else {
            res.render('error.ejs', {
                message: `Product ${model_no} not found`,
                isLoggedIn: true,
                userRole: true
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating the product'
        });
    }
};