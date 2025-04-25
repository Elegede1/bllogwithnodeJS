const Comment = require('../models/Comment');
const Blog = require('../models/blog');

// Create a new comment
const comment_create = async (req, res) => {
  try {
    const { content, blogId } = req.body;
    
    // Create new comment
    const comment = new Comment({
      content,
      user: req.user._id,
      blog: blogId
    });
    
    await comment.save();
    req.flash('success_msg', 'Comment added successfully');
    res.redirect(`/blogs/${blogId}`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error adding comment');
    res.redirect(`/blogs/${req.body.blogId}`);
  }
};

// Delete a comment
const comment_delete = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    // Check if comment exists
    if (!comment) {
      req.flash('error_msg', 'Comment not found');
      return res.redirect('back');
    }
    
    // Check if user is the comment owner or admin
    if (comment.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      req.flash('error_msg', 'Not authorized');
      return res.redirect('back');
    }
    
    const blogId = comment.blog;
    await comment.remove();
    
    req.flash('success_msg', 'Comment deleted');
    res.redirect(`/blogs/${blogId}`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting comment');
    res.redirect('back');
  }
};

module.exports = {
  comment_create,
  comment_delete
};
