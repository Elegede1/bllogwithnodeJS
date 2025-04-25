// blog_index, blog_details, blog_create_get, blog_create_post, blog_delete
const Blog = require('../models/blog');
const Comment = require('../models/Comment'); // import the Comment model. This will be used to interact with the comments collection in the database.


const blog_index = (req, res) => {
    Blog.find().sort({ createdAt: -1 }) // find all blogs and sort them by createdAt field in descending order. Which means fetch from the newest to the oldest
    .then((result) => {
        res.render('blogs/index', { title: 'All blogs', blogs: result }); // render the blogs.ejs file and pass the title and blogs variables to it.
    })
    .catch((err) => {
        console.log(err);
    });
};

// Update the blog_details function
const blog_details = async (req, res) => {
    try {
      const id = req.params.id;
      const blog = await Blog.findById(id);
      
      if (!blog) {
        return res.status(404).render('404', { title: 'Blog not found' });
      }
      
      // Fetch comments for this blog and populate user information
      const comments = await Comment.find({ blog: id })
        .populate('user', 'username profile.name')
        .sort({ createdAt: -1 });
      
      res.render('blogs/details', { 
        blog, 
        title: blog.title,
        comments,
        user: req.user // Pass the current user to the template
      });
    } catch (err) {
      console.error(err);
      res.status(500).render('500', { title: 'Server Error' });
    }
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