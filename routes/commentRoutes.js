const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { ensureAuthenticated } = require('../config/auth');

// Apply authentication middleware to all comment routes
router.use(ensureAuthenticated);

// Create comment
router.post('/create', ensureAuthenticated, commentController.comment_create);

// Delete comment
router.delete('/:id', ensureAuthenticated, commentController.comment_delete);

module.exports = router;
