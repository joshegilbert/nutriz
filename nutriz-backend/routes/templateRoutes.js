const express = require("express");
const {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} = require("../controllers/templateController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.route("/").get(listTemplates).post(createTemplate);

router.route("/:id").put(updateTemplate).delete(deleteTemplate);

module.exports = router;
