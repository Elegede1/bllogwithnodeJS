const mongoose = require('mongoose'); // import mongoose library. This will allow us to connect to the MongoDB database and define models for our data.
const Schema = mongoose.Schema; // create a new schema object. This will be used to define the structure of our data in the database.

const blogSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    snippet: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    }
}, { timestamps: true }); // create a new schema object. This will be used to define the structure of our data in the database. The timestamps option will automatically add createdAt and updatedAt fields to the schema.


module.exports = mongoose.model('Blog', blogSchema); // export the model. This will be used to interact with the database.
// The first argument is the name of the model, and the second argument is the schema object. Mongoose will automatically create a collection with the same name as the model (in lowercase and pluralized form) in the database.
// The model will be used to create, read, update, and delete documents in the collection.