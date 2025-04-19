const express = require('express')
const morgan = require('morgan');
const mongoose = require('mongoose');
const Blog = require('./models/blog'); // import the blog model. This will be used to interact with the database.

// express app
const app = express();

// connect to mongodb
const dbURI = 'mongodb+srv://elegedeblog:XahAv01JiyrGKdOL@plentytinz.thbcvqi.mongodb.net/?retryWrites=true&w=majority&appName=plentytinz'
// mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((result) => app.listen(3000, () => {
        console.log("Connected to DB and server is running on port 3000")
    }))
    .catch((err) => console.log(err));


app.locals.currentYear = new Date().getFullYear(); // set a local variable that will be available in all views. This will be used to display the current year in the footer of the website.


// register view engine
app.set('view engine', 'ejs');
app.set('views', 'views'); // set the views directory. This is where we will put our EJS files. the syntax is app.set('views', 'directory_name')
app.use(express.static('public')); // serve static files from the public directory. This is where we will put our CSS and JS files.

// register view engine
app.set('view engine', 'ejs');


// middleware & static files
app.use(express.static('public/css/')); // serve static files from the public directory. This is where we will put our CSS and JS files.
app.use(express.urlencoded({ extended: true })); // parse URL-encoded bodies (as sent by HTML forms). This will allow us to access the form data in the request body.
app.use(morgan('dev')); // use morgan middleware to log requests to the console. The 'dev' option will log the request method, url, status code, and response time.

// app.use((req, res, next) => {
//     console.log('new request made:');
//     console.log('host: ', req.hostname);
//     console.log('path: ', req.path);
//     console.log('method: ', req.method);
//     next();
//   });

// app.use((req, res, next) => {
//   console.log('in the next middleware');
//   next();
// });

// routes
// app.get('/', (req, res) => {
//     const blogs = [
//         {title: 'Yoshi finds eggs', snippet: 'Lorem ipsum dolor sit amet consectetur'},
//         {title: 'Mario finds stars', snippet: 'Lorem ipsum dolor sit amet consectetur'},
//         {title: 'How to defeat bowser', snippet: 'Lorem ipsum dolor sit amet consectetur'},
//       ];
//     // res.send('<p>Home Page</p>'); // send a response to the client. This will send a string as a response.
//     // res.sendFile('./views/index.html', { root: __dirname }); // send the index.html file as a response. The __dirname variable is a global variable that contains the path to the current directory.
//     res.render('index', { title: 'Home', blogs }); // render the index.ejs file and pass the title variable to it. The title variable will be used in the EJS file to set the title of the page.
// });

app.get('/about', (req, res) => {
    // res.send('<p>About Page</p>');
    // res.sendFile('./views/about.html', { root: __dirname });
    res.render('about', { title: 'About' });
});

app.get('/about-me', (req, res) => {
    res.redirect('/about');
});

app.get('/contact', (req, res) => {
    // res.send('<p>Contact Page</p>');
    // res.sendFile('./views/contact.html', { root: __dirname });
    res.render('contact', { title: 'Contact' });
});

app.get('/contact-us', (req, res) => {
    res.redirect('/contact');
});



// these are the routes for the blog app
app.get('/', (req, res) => {
    res.redirect('/blogs'); // redirect to the blogs page
});


app.get('/blogs', (req, res) => {
    // res.send('<p>All blogs</p>');
    // res.sendFile('./views/blogs.html', { root: __dirname });
    Blog.find().sort({ createdAt: -1 }) // find all blogs and sort them by createdAt field in descending order. Which means fetch from the newest to the oldest
        .then((result) => {
            res.render('index', { title: 'All blogs', blogs: result }); // render the blogs.ejs file and pass the title and blogs variables to it.
        })
        .catch((err) => {
            console.log(err);
        });
});


app.post('/blogs', (req, res) => {
    // res.send('<p>Create blog</p>');
    // res.sendFile('./views/create.html', { root: __dirname });
    const blog = new Blog(req.body); // create a new blog object and pass the request body to it.
    // the code below is the same as the one above but using destructuring to get the values from the request body
    // const blog = new Blog({
    //     title: req.body.title,
    //     snippet: req.body.snippet,
    //     body: req.body.body
    // });
    blog.save()
        .then((result) => {
            res.redirect('/blogs');
        })
        .catch((err) => {
            console.log(err);
        });
});


app.get('/blogs/create', (req, res) => {
    res.render('create', { title: 'Create a new blog' });
});


app.get('/blogs/:id', (req, res) => {
    const id = req.params.id; // get the id from the request parameters. The :id part of the URL is a placeholder for the actual id value.
    Blog.findById(id)
        .then((result) => {
            res.render('details', { title: 'Blog details', blog: result });
        })
        .catch((err) => {
            console.log(err);
        });
});


app.delete('/blogs/:id', (req, res) => {
    const id = req.params.id; // get the id from the request parameters. The :id part of the URL is a placeholder for the actual id value.
    Blog.findByIdAndDelete(id) // find the blog by id and delete it
        .then((result) => {
            res.json({ redirect: '/blogs' }); // send a JSON response with a redirect URL. This will be used to redirect the user to the blogs page after deleting the blog.
        })
        .catch((err) => {
            console.log(err);
        });
});


// 404 page
app.use((req, res) => { // middleware function to handle 404 errors. This function will be called if no other route matches the request.
    // res.status(404).send('<h1>Page not found</h1>');// send a response
    // res.status(404).sendFile('./views/404.html', { root: __dirname });
    res.status(404).render('404', { title: '404' });
});