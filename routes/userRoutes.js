const express = require('express');
const router = express.Router();
const User = require('../models/users');
const { ensureAuthenticated } = require('../config/auth');

// Render search users page
router.get('/search', ensureAuthenticated, (req, res) => {
  res.render('search-users', {
    title: 'Find Friends',
    user: req.user,
    usersFound: [], // Pass empty array for initial render
    searchTerm: ''  // Pass empty search term for initial render
  });
});

// Handle search form submission from search-users.ejs
router.post('/search', ensureAuthenticated, async (req, res) => {
  try {
    const { searchTerm } = req.body;
    let usersFound = [];

    if (searchTerm && searchTerm.trim() !== '') {
      usersFound = await User.find({
        $and: [
          { _id: { $ne: req.user._id } }, // Exclude current user
          // { _id: { $nin: req.user.friends } }, // Optionally exclude existing friends
          {
            $or: [
              { username: { $regex: searchTerm, $options: 'i' } },
              { 'profile.name': { $regex: searchTerm, $options: 'i' } },
              { email: { $regex: searchTerm, $options: 'i' } }
            ]
          }
        ]
      }).select('username name email profile.name profile.profilePicture friends').limit(10).lean(); // Added .lean()
    }

    res.render('search-users', {
      title: searchTerm ? `Search Results for "${searchTerm}"` : 'Find Friends',
      user: req.user,
      usersFound: usersFound,
      searchTerm: searchTerm || ''
    });
  } catch (error) {
    console.error('Search submission error:', error);
    req.flash('error_msg', 'Search failed. Please try again.');
    res.redirect('/users/search-users'); // Redirect back to the search page on error
  }
});


// Send Friend Request
router.post('/send-request/:recipientId', ensureAuthenticated, async (req, res) => {
  try {
    const recipientId = req.params.recipientId;
    const currentUserId = req.user._id;

    // Check if trying to add themselves
    if (recipientId === currentUserId.toString()) {
      req.flash('error_msg', 'You cannot add yourself as a friend');
      // return res.redirect('back');
      return res.redirect('/users/search');
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      req.flash('error_msg', 'User not found');
      // return res.redirect('back');
      return res.redirect('/users/search');
    }

    // Check if already friends
    if (req.user.friends.includes(recipientId)) {
      req.flash('error_msg', 'User is already in your friend list');
      // return res.redirect('back');
      return res.redirect('/users/search');
    }

    // Check if a request is already pending (either way)
    if (req.user.pendingRequestsSent.includes(recipientId) || req.user.pendingRequestsReceived.includes(recipientId)) {
      req.flash('info_msg', 'A friend request is already pending with this user.');
      // return res.redirect('back');
      return res.redirect('/users/search');
    }

    // Add to sender's pendingRequestsSent
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { pendingRequestsSent: recipientId } // Use $addToSet to avoid duplicates
    });

    // Add to recipient's pendingRequestsReceived
    await User.findByIdAndUpdate(recipientId, {
      $addToSet: { pendingRequestsReceived: currentUserId } // Use $addToSet
    });

    req.flash('success_msg', `Friend request sent to ${recipient.profile.name || recipient.username}.`);
    // res.redirect('back'); // Redirect back to the page where the request was sent
    return res.redirect('/users/search');
  } catch (error) {
    console.error('Send friend request error:', error);
    req.flash('error_msg', 'Failed to send friend request.');
    res.redirect('back');
    return res.redirect('/users/search');
  }
});

// Remove friend
router.post('/remove-friend/:userId', ensureAuthenticated, async (req, res) => {
  try {
    const friendId = req.params.userId;
    const currentUserId = req.user._id;

    // Remove friend from current user's friend list
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { friends: friendId }
    });

    // Remove current user from friend's friend list
    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: currentUserId }
    });

    req.flash('success_msg', 'Friend removed successfully');
    res.redirect('/users/friends');
  } catch (error) {
    console.error('Remove friend error:', error);
    req.flash('error_msg', 'Failed to remove friend');
    res.redirect('/users/friends');
  }
});


// Add friends page (search and add new friends)
router.get('/add-friends', ensureAuthenticated, async (req, res) => {
  try {
    res.render('friends/add-friends', {
      title: 'Add Friends',
      user: req.user
    });
  } catch (error) {
    console.error('Add friends page error:', error);
    req.flash('error_msg', 'Could not load add friends page');
    res.redirect('/users/friends');
  }
});

// Accept Friend Request
router.post('/accept-request/:senderId', ensureAuthenticated, async (req, res) => {
  try {
    const senderId = req.params.senderId;
    const currentUserId = req.user._id;

    // Add to each other's friends list
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { friends: senderId },
      $pull: { pendingRequestsReceived: senderId, pendingRequestsSent: senderId } // Remove from pending
    });
    await User.findByIdAndUpdate(senderId, {
      $addToSet: { friends: currentUserId },
      $pull: { pendingRequestsSent: currentUserId, pendingRequestsReceived: currentUserId } // Remove from pending
    });

    req.flash('success_msg', 'Friend request accepted.');
    res.redirect('/users/friends');
  } catch (error) {
    console.error('Accept request error:', error);
    req.flash('error_msg', 'Failed to accept friend request.');
    res.redirect('/users/friends');
  }
});

// Reject Friend Request
router.post('/reject-request/:senderId', ensureAuthenticated, async (req, res) => {
  try {
    const senderId = req.params.senderId;
    const currentUserId = req.user._id;

    // Remove from pending lists
    await User.findByIdAndUpdate(currentUserId, { $pull: { pendingRequestsReceived: senderId } });
    await User.findByIdAndUpdate(senderId, { $pull: { pendingRequestsSent: currentUserId } });

    req.flash('info_msg', 'Friend request rejected.');
    res.redirect('/users/friends');
  } catch (error) {
    console.error('Reject request error:', error);
    req.flash('error_msg', 'Failed to reject friend request.');
    res.redirect('/users/friends');
  }
});

// Cancel Friend Request (that the current user sent)
router.post('/cancel-request/:recipientId', ensureAuthenticated, async (req, res) => {
  try {
    const recipientId = req.params.recipientId;
    const currentUserId = req.user._id;

    await User.findByIdAndUpdate(currentUserId, { $pull: { pendingRequestsSent: recipientId } });
    await User.findByIdAndUpdate(recipientId, { $pull: { pendingRequestsReceived: currentUserId } });

    req.flash('info_msg', 'Friend request cancelled.');
    return res.redirect('/users/search');
  } catch (error) {
    console.error('Cancel request error:', error);
    req.flash('error_msg', 'Failed to cancel friend request.');
    return res.redirect('/users/search');
  }
});



// Friends list page
router.get('/friends', ensureAuthenticated, async (req, res) => {
  try {
    // Get current user with populated friends
    const userWithFriends = await User.findById(req.user._id)
    const userWithData = await User.findById(req.user._id)
      .populate('friends', 'username profile.name profile.profilePicture email createdAt _id')
      .populate({ // Populate received requests with sender's details
        path: 'pendingRequestsReceived',
        select: 'username profile.name profile.profilePicture _id createdAt' 
      })
      .lean();

    // Ensure friends and friendRequests are always arrays
    const friends = (userWithData && userWithData.friends) ? userWithData.friends : [];
    const friendRequests = (userWithData && userWithData.pendingRequestsReceived) ? userWithData.pendingRequestsReceived : [];

    res.render('friends', {
      title: 'My Friends',
      user: req.user,
      friends: friends,
      friendRequests: friendRequests, // Pass friendRequests to the template
      friendCount: friends.length
    });
  } catch (error) {
    console.error('Friends list error:', error);
    req.flash('error_msg', 'Could not load friends list');
    res.redirect('/dashboard');
  }
});



// View user profile page
router.get('/:userId', ensureAuthenticated, async (req, res) => {
  try {
    const viewedUser = await User.findById(req.params.userId)
      .populate('friends', 'username profile.name profile.profilePicture') // Optionally populate friends of the viewed user
      .lean();

    if (!viewedUser) {
      req.flash('error_msg', 'User not found.');
      return res.redirect('/users/friends'); // Or some other appropriate page
    }

    res.render('user-profile', { // Assumes you have a 'views/profile.ejs'
      title: `${viewedUser.profile.name || viewedUser.username}'s Profile`,
      viewedUser: viewedUser,
      user: req.user // Logged-in user
    });
  } catch (error) {
    console.error('Error viewing user profile:', error);
    req.flash('error_msg', 'Could not load user profile.');
    res.redirect('/dashboard'); // Or an appropriate fallback
  }
});


module.exports = router;
