const NotAuthorizedError = require('../errors/not-authorized-error');

const requireAuth = (req, res, next) => {
  if (!req.currentUser) {
    throw new NotAuthorizedError();
  }
  next();
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.currentUser) {
      throw new NotAuthorizedError();
    }
    
    const hasRole = Array.isArray(roles) 
      ? roles.includes(req.currentUser.role) 
      : req.currentUser.role === roles;

    if (!hasRole) {
      throw new NotAuthorizedError();
    }
    
    next();
  };
};

module.exports = {
  requireAuth,
  requireRole
};
