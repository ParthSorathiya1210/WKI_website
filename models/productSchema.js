const mongoose = require("mongoose");

// const productSchema = new mongoose.Schema({
//     name: {
//         type: String,
//         required: true
//     },
//     model_no: {
//         type: Number,
//         required: true
//     },
//     price: {
//         type: Number,
//         required: true
//     },
//     type: {
//         type: String,
//         enum:["OpenWell","Vseries"],
//         required: true
//     },
//     image_url: {
//         type: String,
//         required: true
//     }
// });


const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image_url: { type: String, required: true },
    model_no: { type: String, required: true },
    price: { type: Number, required: true },
    type: { type: String, required: true },
    height: { type: Number, required: true },
    power_source: { type: String, required: true },
    frequency: { type: Number, required: true },
    voltageLow: { type: Number, required: true },
    voltageHigh: { type: Number, required: true },
    brand: { type: String, required: true },
    horsePower: { type: Number, required: true },
    phase: { type: Number, required: true },
    material: { type: String, required: true },
    packagingType: { type: String, required: true },
    description: { type: String, required: true }
});

module.exports = mongoose.model("Product", productSchema);