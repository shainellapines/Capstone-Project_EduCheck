const express = require("express");

const {
    listApprovalRequests,
    approveAccount,
    rejectAccount,
} = require("../controllers/accountApprovalController");

const {
    authenticateToken,
    authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateToken);

// The Administrator sees what is waiting; only the Principal decides.
router.get("/", authorizeRoles("principal", "admin"), listApprovalRequests);

router.post("/:id/approve", authorizeRoles("principal"), approveAccount);

router.post("/:id/reject", authorizeRoles("principal"), rejectAccount);

module.exports = router;
