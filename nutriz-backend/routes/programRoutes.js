const express = require('express');
const {
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
} = require('../controllers/programController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.route('/').get(getPrograms).post(createProgram);
router.route('/:id').get(getProgramById).put(updateProgram).delete(deleteProgram);

module.exports = router;
