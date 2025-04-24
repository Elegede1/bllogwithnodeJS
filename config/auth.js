module.exports = {
  ensureAuthenticated: function(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) {
      return next();
    }
    req.flash('error_msg', 'Please log in to view this resource');
    res.redirect('/auth/login');
  },
  
  // Alternative approach if isAuthenticated is not available
  checkAuthenticated: function(req, res, next) {
    if (req.user) {
      return next();
    }
    req.flash('error_msg', 'Please log in to view this resource');
    res.redirect('/auth/login');
  },

  ensureAdmin: function(req, res, next) {
    if (req.isAuthenticated() && req.user.isAdmin) {
      return next();
    }
    req.flash('error_msg', 'You do not have permission to access this resource');
    res.redirect('/');
  }
};
