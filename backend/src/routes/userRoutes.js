const express = require("express");

const {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    searchUsers,
    resetUserPassword,
    finishAccountSetup
} = require("../controllers/userController");

const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

// Only administrators can manage users
router.use(
    authenticateToken,
    authorizeRoles("admin")
);

router.get("/", getUsers);

router.get("/search", searchUsers);

router.get("/:id", getUserById);

router.post("/", createUser);

router.put("/:id", updateUser);

router.post("/:id/reset-password", resetUserPassword);

router.post("/:id/finish-setup", finishAccountSetup);

router.delete("/:id", deleteUser);

module.exports = router;