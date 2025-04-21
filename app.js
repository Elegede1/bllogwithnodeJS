const express = require('express')
const morgan = require('morgan');
const mongoose = require('mongoose');
const blogRoutes = require('./routes/blogRoutes'); // import the blog routes. This will be used to define the routes for the blog section of the website.

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

// blog routes
app.use('/blogs', blogRoutes); // use the blog routes. This will mount the blogRoutes module to the /blogs path. This means that all routes defined in the blogRoutes module will be prefixed with /blogs.


// 404 page
app.use((req, res) => { // middleware function to handle 404 errors. This function will be called if no other route matches the request.
    // res.status(404).send('<h1>Page not found</h1>');// send a response
    // res.status(404).sendFile('./views/404.html', { root: __dirname });
    res.status(404).render('404', { title: '404' });
});