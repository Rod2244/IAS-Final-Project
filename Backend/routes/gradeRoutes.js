const express = require("express");
const gradeService = require("../services/gradeService");

const router = express.Router();

// Get all grades
router.get("/", async (req, res) => {
  try {
    const grades = await gradeService.getAllGrades();
    res.status(200).json({ success: true, data: grades });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get grades by student
router.get("/student/:studentId", async (req, res) => {
  try {
    const grades = await gradeService.getGradesByStudent(req.params.studentId);
    res.status(200).json({ success: true, data: grades });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get grades by teacher
router.get("/teacher/:teacherId", async (req, res) => {
  try {
    const grades = await gradeService.getGradesByTeacher(req.params.teacherId);
    res.status(200).json({ success: true, data: grades });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get grades by class
router.get("/class/:classId", async (req, res) => {
  try {
    const grades = await gradeService.getGradesByClass(req.params.classId);
    res.status(200).json({ success: true, data: grades });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create grade
router.post("/", async (req, res) => {
  try {
    const grade = await gradeService.createGrade(req.body);
    res.status(201).json({ success: true, data: grade });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update grade
router.put("/:id", async (req, res) => {
  try {
    const grade = await gradeService.updateGrade(req.params.id, req.body);
    res.status(200).json({ success: true, data: grade });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete grade
router.delete("/:id", async (req, res) => {
  try {
    const result = await gradeService.deleteGrade(req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
