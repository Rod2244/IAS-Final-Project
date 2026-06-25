const express = require("express");
const studentService = require("../services/studentService");

const router = express.Router();

// Get all students
router.get("/", async (req, res) => {
  try {
    const students = await studentService.getAllStudents();
    res.status(200).json({ success: true, data: students });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get student by LRN
router.get("/lrn/:lrn", async (req, res) => {
  try {
    const student = await studentService.getStudentByLRN(req.params.lrn);
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get students by grade
router.get("/grade/:grade", async (req, res) => {
  try {
    const students = await studentService.getStudentsByGrade(req.params.grade);
    res.status(200).json({ success: true, data: students });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get students by section
router.get("/section/:section", async (req, res) => {
  try {
    const students = await studentService.getStudentsBySection(
      req.params.section,
    );
    res.status(200).json({ success: true, data: students });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get student by ID
router.get("/:id", async (req, res) => {
  try {
    const student = await studentService.getStudentById(req.params.id);
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create student with auth account (admin endpoint)
router.post("/admin/create-account", async (req, res) => {
  try {
    const studentData = {
      ...req.body,
    };

    const result = await studentService.createStudentWithAccount(studentData);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Send temporary password to student email
router.post("/admin/send-temp-password", async (req, res) => {
  try {
    const { email, name, tempPassword } = req.body;

    if (!email || !tempPassword) {
      return res
        .status(400)
        .json({ error: "Email and temporary password are required." });
    }

    const result = await studentService.sendTemporaryPasswordEmail({
      email,
      name,
      tempPassword,
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create student
router.post("/", async (req, res) => {
  try {
    const student = await studentService.createStudent(req.body);
    res.status(201).json({ success: true, data: student });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update student
router.put("/:id", async (req, res) => {
  try {
    const student = await studentService.updateStudent(req.params.id, req.body);
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete student
router.delete("/:id", async (req, res) => {
  try {
    const result = await studentService.deleteStudent(req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
