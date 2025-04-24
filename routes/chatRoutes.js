const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');

// Chat page - protected by authentication
router.get('/', ensureAuthenticated, (req, res) => {
  res.render('chat', { 
    title: 'Chat Room',
    user: req.user
  });
});

module.exports = router;
