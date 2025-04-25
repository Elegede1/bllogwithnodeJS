const express = require('express');
const router = express.Router(); // create a new router object. This will be used to define the routes for the blog section of the website.
const blogController = require('../controllers/blogController'); // import the blog controller. This will be used to define the routes for the blog section of the website.
const { ensureAuthenticated } = require('../config/auth');


// blog routes
router.get('/', blogController.blog_index); // define the route for the index page. This will be used to display all blogs. The blogController.blog_index function will be called when this route is accessed.


router.post('/', ensureAuthenticated, blogController.blog_create_post); // define the route for the create page. This will be used to create a new blog. The blogController.blog_create_post function will be called when this route is accessed.


router.get('/create', ensureAuthenticated, blogController.blog_create_get); // define the route for the create page. This will be used to display the form to create a new blog. The blogController.blog_create_get function will be called when this route is accessed.


router.get('/:id', blogController.blog_details); // define the route for the details page. This will be used to display a single blog. The blogController.blog_details function will be called when this route is accessed.


router.delete('/:id', ensureAuthenticated, blogController.blog_delete); // define the route for the delete page. This will be used to delete a blog. The blogController.blog_delete function will be called when this route is accessed.

module.exports = router; // export the router object. This will be used to import the routes in the main app file.