// routes/userRoutes.js

const router  = require("express").Router();
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateWallet,
  changePassword,
} = require("../controllers/userController");
const { protect, requireRole } = require("../middleware/authMiddleware");
const { validate }             = require("../middleware/validate");
const { apiLimiter }           = require("../middleware/rateLimiter");

// All user routes require authentication
router.use(protect);
router.use(apiLimiter);

// Self-service (any authenticated user)
router.patch("/me/wallet",   validate("updateWallet"),   updateWallet);
router.patch("/me/password", validate("changePassword"), changePassword);

// Admin-only routes
router.get  ("/",    requireRole("admin"), getAllUsers);
router.get  ("/:id", getUserById);                              // admin or self (checked in controller)
router.put  ("/:id", requireRole("admin"), validate("updateUser"), updateUser);
router.delete("/:id", requireRole("admin"), deleteUser);

module.exports = router;