require('dotenv').config(); // Load environment variables from .env file


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
const methodOverride = require('method-override');
const contactRoutes = require('./routes/contactRoutes');
const Message = require('./models/Message'); // Add this
const GroupChat = require('./models/GroupChat'); // Add this
const userRoutes = require('./routes/userRoutes'); // Import user routes for search and friend management
const friendRoutes = require('./routes/friendRoutes');




// express app
const app = express();
const server = http.createServer(app);

// Configure session middleware BEFORE Socket.io
const sessionMiddleware = session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
});

// Use session middleware
app.use(sessionMiddleware);

// Passport config
require('./config/passport')(passport);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Configure Socket.io with session support
const io = socketio(server);

// To store mapping of userId to socket.id
const userSockets = {};

io.on('connection', (socket) => {
  console.log('New WebSocket connection');
  const userId = socket.handshake.query.userId;
  const userName = socket.handshake.query.userName;

  if (userId) {
    console.log(`User ${userName} (${userId}) connected with socket ${socket.id}`);
    userSockets[userId] = socket.id; // Store the mapping
  }

  // Listen for chat messages (can be public or adapted)
  socket.on('chatMessage', (msg) => {
    io.emit('chatMessage', msg); // Broadcasts to everyone
    // For public messages or general room messages
    // For 1-on-1, we'll use 'private_message'
    console.log('Public message received:', msg);
    // Example: io.to('some-room').emit('chatMessage', { user: userName, text: msg });
  });

  // Listen for a private message
  socket.on('private_message', (data) => {
    // data should contain { recipientId, message }
    const recipientSocketId = userSockets[data.recipientId];
    const senderId = userId; // The user ID of the person sending the message

    if (recipientSocketId) {
      // Send to recipient
      io.to(recipientSocketId).emit('private_message', {
        senderId: senderId,
        senderName: userName,
        message: data.message,
        timestamp: new Date()
      });
      // Send back to sender (for their own chat window with recipient)
      socket.emit('private_message', {
        senderId: senderId,
        recipientId: data.recipientId, // To know which chat window this belongs to
        senderName: userName,
        message: data.message,
        timestamp: new Date()
      });
      console.log(`Message from ${userName} (${senderId}) to ${data.recipientId}: ${data.message}`);
    } else {
      // Handle user not found/offline
      socket.emit('user_not_found', { recipientId: data.recipientId });
      console.log(`User ${data.recipientId} not found or offline.`);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
    console.log(`User ${userName} (${userId}) disconnected`);
    if (userId) {
      delete userSockets[userId]; // Clean up mapping
    }
  });
});


// connect to mongodb
const dbURI = process.env.MONGODB_URI;

if (!dbURI) {
  console.error('MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

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

// Body parser
app.use(express.urlencoded({ extended: false }));

// middleware & static files
app.use(express.static('public/css/')); // serve static files from the public directory. This is where we will put our CSS and JS files.
app.use(morgan('dev')); // use morgan middleware to log requests to the console. The 'dev' option will log the request method, url, status code, and response time.
app.use(methodOverride('_method'));

  
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
app.use('/chat', require('./routes/chatRoutes')); // This includes the chat routes
// blog routes
app.use('/blogs', blogRoutes); // use the blog routes. This will mount the blogRoutes module to the /blogs path. This means that all routes defined in the blogRoutes module will be prefixed with /blogs.
app.use('/comments', require('./routes/commentRoutes'));
app.use('/contact', contactRoutes); // Use the contact routes for handling contact form submissions
app.use('/users', userRoutes); // Add this for user search and friend management
app.use('/friends', friendRoutes);

app.get('/about', (req, res) => {
    res.render('about', { title: 'About' });
});

app.get('/contact', (req, res) => {
    res.render('contact', { title: 'Contact' });
});


// these are the routes for the blog app
app.get('/', (req, res) => {
    res.redirect('/blogs'); // redirect to the blogs page
});

// Create admin user script
app.get('/setup-admin', async (req, res) => { // create an admin user route. This will be used to create an admin user for the application.
    try {
      const User = require('./models/users'); // Import the User model here to avoid circular dependency issues
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



// 404 page
app.use((req, res) => { // middleware function to handle 404 errors. This function will be called if no other route matches the request.
    // res.status(404).send('<h1>Page not found</h1>');// send a response
    // res.status(404).sendFile('./views/404.html', { root: __dirname });
    res.status(404).render('404', { title: '404' });
});