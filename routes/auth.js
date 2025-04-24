const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/users');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


// Set up multer for file storage
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
      const uploadDir = './assets/uploads/';
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  });
  
  // File filter
  const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  };
  
  // Upload configuration
  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB max file size
    },
    fileFilter: fileFilter
  });

// Register page
router.get('/register', (req, res) => {
  res.render('register');
});

// Register handle
router.post('/register', upload.single('profilePicture'), async (req, res) => {
    const { username, email, password, confirmPassword, age } = req.body;
    
    try {
      // Validation
      if (!username || !email || !password || !confirmPassword || !age) {
        return res.render('register', { 
          error: 'Please fill in all required fields',
          username,
          email,
          age
        });
      }
      
      if (password !== confirmPassword) {
        return res.render('register', { 
          error: 'Passwords do not match',
          username,
          email,
          age
        });
      }
      
      // Check if user exists
      const userExists = await User.findOne({ $or: [{ username }, { email }] });
      if (userExists) {
        return res.render('register', { 
          error: 'Username or email already exists',
          username,
          email,
          age
        });
      }
      
      // Process profile picture
      let profilePicturePath = '/assets/images/default-profile.png'; // Default
      if (req.file) {
        profilePicturePath = `/assets/uploads/${req.file.filename}`;
      }
      
      // Create new user
      const newUser = new User({
        username,
        email,
        password,
        isAdmin: false, // Set to true for admin
        profile: {
          name: username,
          age: parseInt(age),
          job: '',
          hobbies: [],
          profilePicture: profilePicturePath
        }
      });
      
      await newUser.save();
      req.flash('success_msg', 'You are now registered and can log in');
      res.redirect('/auth/login');
    } catch (err) {
      console.error(err);
      res.render('register', { 
        error: 'Server error',
        username,
        email,
        age
      });
    }
  });
  
  // Login page
  router.get('/login', (req, res) => {
    res.render('login');
  });
  
  // Login handle
  router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
      successRedirect: '/profile',
      failureRedirect: '/auth/login',
      failureFlash: true
    })(req, res, next);
  });
  
  // Logout
  router.get('/logout', (req, res) => {
    req.logout(function(err) {
      if (err) { return next(err); }
      req.flash('success_msg', 'You are logged out');
      res.redirect('/auth/login');
    });
  });
  
  module.exports = router;
