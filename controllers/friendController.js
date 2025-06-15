const Friend = require('../models/Friend');
const User = require('../models/users'); // Make sure this matches your User model file name

// Render the friends page
const renderFriendsPage = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all accepted friendships
    const friendships = await Friend.find({
      status: 'accepted',
      $or: [
        { requester: userId },
        { recipient: userId }
      ]
    }).populate('requester recipient', 'username email profile.name profile.avatar');

    // Extract friends
    const friends = friendships.map(friendship => {
      const friend = friendship.requester._id.toString() === userId.toString() 
        ? friendship.recipient 
        : friendship.requester;
      
      return {
        _id: friend._id,
        username: friend.username,
        email: friend.email,
        name: friend.profile?.name,
        avatar: friend.profile?.avatar
      };
    });

    // Get pending requests
    const pendingRequests = await Friend.find({
      recipient: userId,
      status: 'pending'
    }).populate('requester', 'username email profile.name profile.avatar');

    const requests = pendingRequests.map(request => ({
      _id: request._id,
      requester: {
        _id: request.requester._id,
        username: request.requester.username,
        email: request.requester.email,
        name: request.requester.profile?.name,
        avatar: request.requester.profile?.avatar
      },
      createdAt: request.createdAt
    }));

    res.render('friends', { 
      title: 'My Friends', 
      friends,
      pendingRequests: requests,
      user: req.user 
    });
  } catch (error) {
    console.error('Error loading friends page:', error);
    res.status(500).render('404', { title: 'Server Error' });
  }
};

// Send a friend request
const sendFriendRequest = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const requesterId = req.user._id;

    // Check if users exist
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent sending request to self
    if (recipientId === requesterId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot send friend request to yourself' });
    }

    // Check if a request already exists
    const existingRequest = await Friend.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId }
      ]
    });

    if (existingRequest) {
      return res.status(400).json({ 
        success: false, 
        message: 'A friend request already exists between these users' 
      });
    }

    // Create new friend request
    const newFriendRequest = new Friend({
      requester: requesterId,
      recipient: recipientId,
      status: 'pending'
    });

    await newFriendRequest.save();
    
    return res.status(201).json({ 
      success: true, 
      message: 'Friend request sent successfully' 
    });
  } catch (error) {
    console.error('Error sending friend request:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Accept a friend request
const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const friendRequest = await Friend.findById(requestId);
    
    if (!friendRequest) {
      return res.status(404).json({ success: false, message: 'Friend request not found' });
    }

    // Ensure the current user is the recipient of the request
    if (friendRequest.recipient.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to accept this request' });
    }

    // Update request status to accepted
    friendRequest.status = 'accepted';
    await friendRequest.save();

    return res.status(200).json({ success: true, message: 'Friend request accepted' });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Reject a friend request
const rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const friendRequest = await Friend.findById(requestId);
    
    if (!friendRequest) {
      return res.status(404).json({ success: false, message: 'Friend request not found' });
    }

    // Ensure the current user is the recipient of the request
    if (friendRequest.recipient.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to reject this request' });
    }

    // Update request status to rejected or delete it
    await Friend.findByIdAndDelete(requestId);

    return res.status(200).json({ success: true, message: 'Friend request rejected' });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete a friend (remove friendship)
const deleteFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user._id;

    // Find and delete the friendship
    const deletedFriendship = await Friend.findOneAndDelete({
      status: 'accepted',
      $or: [
        { requester: userId, recipient: friendId },
        { requester: friendId, recipient: userId }
      ]
    });

    if (!deletedFriendship) {
      return res.status(404).json({ success: false, message: 'Friendship not found' });
    }

    return res.status(200).json({ success: true, message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Error deleting friend:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all friends for the current user (API endpoint)
const getFriends = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all accepted friend requests where the user is either requester or recipient
    const friendships = await Friend.find({
      status: 'accepted',
      $or: [
        { requester: userId },
        { recipient: userId }
      ]
    }).populate('requester recipient', 'username email profile.name profile.avatar');

    // Extract the friend data (the other user in each friendship)
    const friends = friendships.map(friendship => {
      const friend = friendship.requester._id.toString() === userId.toString() 
        ? friendship.recipient 
        : friendship.requester;
      
      return {
        _id: friend._id,
        username: friend.username,
        email: friend.email,
        name: friend.profile?.name,
        avatar: friend.profile?.avatar,
        friendshipId: friendship._id
      };
    });

    return res.status(200).json({ success: true, friends });
  } catch (error) {
    console.error('Error getting friends:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get pending friend requests for the current user (API endpoint)
const getPendingRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all pending requests where the user is the recipient
    const pendingRequests = await Friend.find({
      recipient: userId,
      status: 'pending'
    }).populate('requester', 'username email profile.name profile.avatar');

    const requests = pendingRequests.map(request => ({
      _id: request._id,
      requester: {
        _id: request.requester._id,
        username: request.requester.username,
        email: request.requester.email,
        name: request.requester.profile?.name,
        avatar: request.requester.profile?.avatar
      },
      createdAt: request.createdAt
    }));

    return res.status(200).json({ success: true, requests });
  } catch (error) {
    console.error('Error getting pending requests:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  renderFriendsPage,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  deleteFriend,
  getFriends,
  getPendingRequests
};
