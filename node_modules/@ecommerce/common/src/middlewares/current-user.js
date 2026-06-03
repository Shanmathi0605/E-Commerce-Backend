const jwt = require('jsonwebtoken');

const currentUser = (req, res, next) => {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  } else if (req.session && req.session.jwt) {
    token = req.session.jwt;
  }

  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_KEY || 'asdfasdf');
    req.currentUser = payload;
  } catch (err) {
    // Ignore invalid tokens; require-auth middleware will reject requests that need auth
  }

  next();
};

module.exports = currentUser;
