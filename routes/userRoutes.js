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
    res.redirect('/users/search'); // Redirect back to the search page on error
  }
});


// Add friend
router.post('/add-friend/:userId', ensureAuthenticated, async (req, res) => {
  try {
    const friendId = req.params.userId;
    const currentUserId = req.user._id;

    // Check if trying to add themselves
    if (friendId === currentUserId.toString()) {
      req.flash('error_msg', 'You cannot add yourself as a friend');
      return res.redirect('/users/friends');
    }

    // Check if friend exists
    const friend = await User.findById(friendId);
    if (!friend) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/users/friends');
    }

    // Check if already friends
    if (req.user.friends.includes(friendId)) {
      req.flash('error_msg', 'User is already in your friend list');
      return res.redirect('/users/friends');
    }

    // Add friend to current user's friend list
    await User.findByIdAndUpdate(currentUserId, {
      $push: { friends: friendId }
    });

    // Add current user to friend's friend list (mutual friendship)
    await User.findByIdAndUpdate(friendId, {
      $push: { friends: currentUserId }
    });

    req.flash('success_msg', `${friend.profile.name || friend.username} has been added to your friends`);
    res.redirect('/users/friends');
  } catch (error) {
    console.error('Add friend error:', error);
    req.flash('error_msg', 'Failed to add friend');
    res.redirect('/users/friends');
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

// Friends list page
router.get('/friends', ensureAuthenticated, async (req, res) => {
  try {
    // Get current user with populated friends
    const userWithFriends = await User.findById(req.user._id)
      .populate('friends', 'username profile.name profile.profilePicture email createdAt')
      .lean();

    // Ensure friends is always an array, even if userWithFriends or userWithFriends.friends is null/undefined
    const friends = (userWithFriends && userWithFriends.friends) ? userWithFriends.friends : [];

    res.render('friends', {
      title: 'My Friends',
      user: req.user,
      friends: friends,
      friendCount: friends.length
    });
  } catch (error) {
    console.error('Friends list error:', error);
    req.flash('error_msg', 'Could not load friends list');
    res.redirect('/dashboard');
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
