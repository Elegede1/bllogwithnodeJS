const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const User = require('../models/users');



router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    // Fetch other users to chat with (excluding the current user)
    // Adjust 'name' and '_id' if your User model schema is different
    const otherUsers = await User.find({ _id: { $ne: req.user._id } }).select('name _id email').lean();

    res.render('chat', {
      title: 'Chat Room',
      user: req.user, // Contains id, name, email etc. from Passport
      otherUsers: otherUsers // Pass other users to the template
    });
  } catch (error) {
    console.error("Error fetching users for chat:", error);
    req.flash('error_msg', 'Could not load chat users.');
    res.redirect('/dashboard'); // Or some other appropriate page
  }
});

module.exports = router;
