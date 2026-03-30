// routes/authRoutes.js

const router = require("express").Router();
const { register, login, refresh, logout, logoutAll, me } = require("../controllers/authController");
const { protect }                = require("../middleware/authMiddleware");
const { validate }               = require("../middleware/validate");
const { loginLimiter, registerLimiter } = require("../middleware/rateLimiter");

// Public routes
router.post("/register", registerLimiter, validate("register"), register);
router.post("/login",    loginLimiter,    validate("login"),    login);
router.post("/refresh",  validate("refreshToken"),              refresh);

// Protected routes (require valid access token)
router.get ("/me",          protect, me);
router.post("/logout",      protect, logout);
router.post("/logout-all",  protect, logoutAll);

module.exports = router;