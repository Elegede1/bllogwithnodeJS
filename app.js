const express = require('express')
const morgan = require('morgan');
const mongoose = require('mongoose');
const blogRoutes = require('./routes/blogRoutes'); // import the blog routes. This will be used to define the routes for the blog section of the website.
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');


// express app
const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Passport config
require('./config/passport')(passport); // import the passport config. This will be used to configure passport for authentication.


// Add the chat routes
app.use('/chat', require('./routes/chatRoutes'));

// Set up Socket.io (add this before the mongoose.connect)
io.on('connection', socket => {
  console.log('New WebSocket connection');
  
  // Welcome current user
  socket.emit('message', {
    username: 'ChatBot',
    text: 'Welcome to the chat!',
    time: new Date().toLocaleTimeString()
  });
  
  // Broadcast when a user connects
  socket.broadcast.emit('message', {
    username: 'ChatBot',
    text: 'A user has joined the chat',
    time: new Date().toLocaleTimeString()
  });
  
  // Listen for chatMessage
  socket.on('chatMessage', msg => {
    const username = socket.request.session?.passport?.user || 'Anonymous';
    
    io.emit('message', {
      username: username,
      text: msg,
      time: new Date().toLocaleTimeString()
    });
  });
  
  // Runs when client disconnects
  socket.on('disconnect', () => {
    io.emit('message', {
      username: 'ChatBot',
      text: 'A user has left the chat',
      time: new Date().toLocaleTimeString()
    });
  });
});



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

// Body parser
app.use(express.urlencoded({ extended: false }));


// middleware & static files
app.use(express.static('public/css/')); // serve static files from the public directory. This is where we will put our CSS and JS files.
app.use(express.urlencoded({ extended: true })); // parse URL-encoded bodies (as sent by HTML forms). This will allow us to access the form data in the request body.
app.use(morgan('dev')); // use morgan middleware to log requests to the console. The 'dev' option will log the request method, url, status code, and response time.


// Express session
app.use(session({
    secret: 'your_secret_key',
    resave: true,
    saveUninitialized: true
  }));
  
  // Passport middleware
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Connect flash
  app.use(flash());
  
  // Global variables
  app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    next();
  });
  
  // Static files
  app.use('/public', express.static(path.join(__dirname, 'public'))); // serve static files from the assets directory. This is where we will put our CSS and JS files.
  app.use('/assets', express.static(path.join(__dirname, 'assets')));

  
  // Routes
  app.use('/auth', require('./routes/auth'));
  app.use('/profile', require('./routes/profile'));


app.get('/about', (req, res) => {
    // res.send('<p>About Page</p>');
    // res.sendFile('./views/about.html', { root: __dirname });
    res.render('about', { title: 'About' });
});

app.get('/contact', (req, res) => {
    // res.send('<p>Contact Page</p>');
    // res.sendFile('./views/contact.html', { root: __dirname });
    res.render('contact', { title: 'Contact' });
});


// these are the routes for the blog app
app.get('/', (req, res) => {
    res.redirect('/blogs'); // redirect to the blogs page
});

// Create admin user script
app.get('/setup-admin', async (req, res) => { // create an admin user route. This will be used to create an admin user for the application.
    try {
      const User = require('./models/User');
      const adminExists = await User.findOne({ username: 'admin' });
      
      if (adminExists) {
        return res.send('Admin already exists');
      }
      
      const admin = new User({
        username: 'admin',
        password: 'admin123', // Will be hashed by the pre-save hook
        isAdmin: true,
        profile: {
          name: 'Administrator',
          age: 30,
          job: 'System Administrator',
          hobbies: ['Coding', 'System Management', 'Security']
        }
      });
      
      await admin.save();
      res.send('Admin user created successfully');
    } catch (err) {
      console.error(err);
      res.status(500).send('Error creating admin user');
    }
  });

  // Admin dashboard route
  app.get('/admin', (req, res) => {
    if (!req.user || !req.user.isAdmin) {
      req.flash('error_msg', 'You are not authorized to view this page');
      return res.redirect('/');
    }
    res.render('admin-dashboard');
  });

// blog routes
app.use('/blogs', blogRoutes); // use the blog routes. This will mount the blogRoutes module to the /blogs path. This means that all routes defined in the blogRoutes module will be prefixed with /blogs.
app.use('/chat', require('./routes/chatRoutes')); // Add this line



// 404 page
app.use((req, res) => { // middleware function to handle 404 errors. This function will be called if no other route matches the request.
    // res.status(404).send('<h1>Page not found</h1>');// send a response
    // res.status(404).sendFile('./views/404.html', { root: __dirname });
    res.status(404).render('404', { title: '404' });
});