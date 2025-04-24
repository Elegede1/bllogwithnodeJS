const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


// Set up multer for file storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = './assets/images/';
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

// Profile page
router.get('/', ensureAuthenticated, (req, res) => {
  res.render('profile', {
    person: req.user.profile.name,
    data: req.user.profile,
    user: req.user
  });
});

// Edit profile page
router.get('/edit', ensureAuthenticated, (req, res) => {
  res.render('edit-profile', {
    profile: req.user.profile,
    user: req.user
  });
});

// Update profile
router.post('/edit', ensureAuthenticated, upload.single('profilePicture'), async (req, res) => {
  try {
    const { name, age, job, hobbies, email } = req.body;
    
    // Convert hobbies string to array
    const hobbiesArray = hobbies.split(',').map(hobby => hobby.trim());
    
    // Update profile information
    req.user.profile.name = name;
    req.user.profile.age = age;
    req.user.profile.job = job;
    req.user.profile.hobbies = hobbiesArray;
    
    // Update email
    req.user.email = email;
    
    // Update profile picture if a new one was uploaded
    if (req.file) {
      // If there's an existing profile picture that's not the default, delete it
      const currentPicPath = req.user.profile.profilePicture;
      if (currentPicPath && 
          currentPicPath !== '/assets/images/default-profile.png' && 
          fs.existsSync(`.${currentPicPath}`)) {
        fs.unlinkSync(`.${currentPicPath}`);
      }
      
      // Set the new profile picture path
      req.user.profile.profilePicture = `/assets/images/${req.file.filename}`;
    }
    
    await req.user.save();
    
    req.flash('success_msg', 'Profile updated successfully');
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating profile');
    res.redirect('/profile/edit');
  }
});

// View another user's profile
router.get('/user/:username', async (req, res) => {
  try {
    const User = require('../models/User');
    const userProfile = await User.findOne({ username: req.params.username });
    
    if (!userProfile) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/');
    }
    
    res.render('profile', {
      person: userProfile.profile.name,
      data: userProfile.profile,
      user: req.user
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error finding user');
    res.redirect('/');
  }
});

// Admin-only routes
router.get('/admin', ensureAuthenticated, (req, res) => {
  if (!req.user.isAdmin) {
    req.flash('error_msg', 'Access denied');
    return res.redirect('/profile');
  }
  
  res.render('admin-dashboard');
});

// Admin user management
router.get('/admin/users', ensureAuthenticated, async (req, res) => {
  if (!req.user.isAdmin) {
    req.flash('error_msg', 'Access denied');
    return res.redirect('/profile');
  }
  
  try {
    const User = require('../models/User');
    const users = await User.find().select('-password');
    
    res.render('admin-users', {
      users
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error fetching users');
    res.redirect('/profile/admin');
  }
});

// Admin edit user
router.get('/admin/edit/:id', ensureAuthenticated, async (req, res) => {
  if (!req.user.isAdmin) {
    req.flash('error_msg', 'Access denied');
    return res.redirect('/profile');
  }
  
  try {
    const User = require('../models/User');
    const user = await User.findById(req.params.id);
    
    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/profile/admin/users');
    }
    
    res.render('admin-edit-user', {
      editUser: user
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error finding user');
    res.redirect('/profile/admin/users');
  }
});

// Admin update user
router.post('/admin/edit/:id', ensureAuthenticated, upload.single('profilePicture'), async (req, res) => {
  if (!req.user.isAdmin) {
    req.flash('error_msg', 'Access denied');
    return res.redirect('/profile');
  }
  
  try {
    const User = require('../models/User');
    const user = await User.findById(req.params.id);
    
    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/profile/admin/users');
    }
    
    const { name, email, age, job, hobbies, isAdmin } = req.body;
    
    // Update user information
    user.email = email;
    user.profile.name = name;
    user.profile.age = age;
    user.profile.job = job;
    user.profile.hobbies = hobbies.split(',').map(hobby => hobby.trim());
    user.isAdmin = isAdmin === 'on';
    
    // Update profile picture if a new one was uploaded
    if (req.file) {
      // If there's an existing profile picture that's not the default, delete it
      const currentPicPath = user.profile.profilePicture;
      if (currentPicPath && 
          currentPicPath !== '/assets/images/default-profile.png' && 
          fs.existsSync(`.${currentPicPath}`)) {
        fs.unlinkSync(`.${currentPicPath}`);
      }
      
      // Set the new profile picture path
      user.profile.profilePicture = `/assets/images/${req.file.filename}`;
    }
    
    await user.save();
    
    req.flash('success_msg', 'User updated successfully');
    res.redirect('/profile/admin/users');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating user');
    res.redirect(`/profile/admin/edit/${req.params.id}`);
  }
});

// Admin delete user
router.post('/admin/delete/:id', ensureAuthenticated, async (req, res) => {
  if (!req.user.isAdmin) {
    req.flash('error_msg', 'Access denied');
    return res.redirect('/profile');
  }
  
  try {
    const User = require('../models/User');
    const user = await User.findById(req.params.id);
    
    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/profile/admin/users');
    }
    
    // Delete user's profile picture if it's not the default
    const picPath = user.profile.profilePicture;
    if (picPath && 
        picPath !== '/assets/images/default-profile.png' && 
        fs.existsSync(`.${picPath}`)) {
      fs.unlinkSync(`.${picPath}`);
    }
    
    await User.deleteOne({ _id: req.params.id });
    
    req.flash('success_msg', 'User deleted successfully');
    res.redirect('/profile/admin/users');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting user');
    res.redirect('/profile/admin/users');
  }
});

module.exports = router;
