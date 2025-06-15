const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const { ensureAuthenticated } = require('../config/auth');

// Render the friends page
router.get('/', ensureAuthenticated, friendController.renderFriendsPage);


// // Apply authentication middleware to all friend routes
// router.use(ensureAuthenticated);

// Send a friend request
router.post('/request', friendController.sendFriendRequest);

// Accept a friend request
router.put('/accept/:requestId', friendController.acceptFriendRequest);

// Reject a friend request
router.put('/reject/:requestId', friendController.rejectFriendRequest);

// Delete a friend
router.delete('/:friendId', friendController.deleteFriend);

// Get all friends
router.get('/', friendController.getFriends);

// Get pending friend requests
router.get('/requests/pending', friendController.getPendingRequests);

module.exports = router;