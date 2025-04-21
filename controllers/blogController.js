// blog_index, blog_details, blog_create_get, blog_create_post, blog_delete
const Blog = require('../models/blog');

const blog_index = (req, res) => {
    Blog.find().sort({ createdAt: -1 }) // find all blogs and sort them by createdAt field in descending order. Which means fetch from the newest to the oldest
    .then((result) => {
        res.render('blogs/index', { title: 'All blogs', blogs: result }); // render the blogs.ejs file and pass the title and blogs variables to it.
    })
    .catch((err) => {
        console.log(err);
    });
};

const blog_details = (req, res) => {
    const id = req.params.id; // get the id from the request parameters. The :id part of the URL is a placeholder for the actual id value.
    Blog.findById(id)
        .then((result) => {
            res.render('blogs/details', { title: 'Blog details', blog: result });
        })
        .catch((err) => {
            res.status(404).render('404', { title: 'Blog Not Found' });
            console.log(err);
        });
};

const blog_create_get = (req, res) => {
    res.render('blogs/create', { title: 'Create a new blog' });
};

const blog_create_post = (req, res) => {
    const blog = new Blog(req.body); // create a new blog object and pass the request body to it.
    blog.save()
        .then((result) => {
            res.redirect('/blogs');
        })
        .catch((err) => {
            console.log(err);
        });
};

const blog_delete = (req, res) => {
    const id = req.params.id; // get the id from the request parameters. The :id part of the URL is a placeholder for the actual id value.
    Blog.findByIdAndDelete(id) // find the blog by id and delete it
        .then((result) => {
            res.json({ redirect: '/blogs' }); // send a JSON response with a redirect URL. This will be used to redirect the user to the blogs page after deleting the blog.
        })
        .catch((err) => {
            console.log(err);
        });
};

module.exports = {
    blog_index,
    blog_details,
    blog_create_get,
    blog_create_post,
    blog_delete,
}