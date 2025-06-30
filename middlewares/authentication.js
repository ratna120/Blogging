const { validateToken } = require("../services/authentication");

function checkForAuthenticationCookie(cookieName) {
  return (req, res, next) => {
    const tokenCookieValue = req.cookies[cookieName];
    if (!tokenCookieValue) {
      return next();
    }

    try {
      const userPayload = validateToken(tokenCookieValue);
      req.user = userPayload;
    } catch (error) {
      console.error("Token validation error:", error);
    }

    return next();
  };
}

function checkAuth(req, res, next) {
  if (!req.user) {
    return res.redirect("/user/signin"); // Redirect to login if not authenticated
  }
  next();
}

module.exports = {
  checkForAuthenticationCookie,
  checkAuth,
};