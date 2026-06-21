const express = require("express");
const attendanceService = require("../services/attendanceService");

const router = express.Router();

// Record attendance
router.post("/", async (req, res) => {
  try {
    const attendance = await attendanceService.recordAttendance(req.body);
    res.status(201).json({ success: true, data: attendance });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get student attendance
router.get("/student/:studentId", async (req, res) => {
  try {
    const attendance = await attendanceService.getStudentAttendance(
      req.params.studentId,
    );
    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get attendance summary
router.get("/summary/:studentId", async (req, res) => {
  try {
    const summary = await attendanceService.getAttendanceSummary(
      req.params.studentId,
    );
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get attendance by date
router.get("/date/:date", async (req, res) => {
  try {
    const attendance = await attendanceService.getAttendanceByDate(
      req.params.date,
    );
    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update attendance
router.put("/:id", async (req, res) => {
  try {
    const attendance = await attendanceService.updateAttendance(
      req.params.id,
      req.body,
    );
    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete attendance
router.delete("/:id", async (req, res) => {
  try {
    const result = await attendanceService.deleteAttendance(req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
