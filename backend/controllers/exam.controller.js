/**
 * Exam Controller
 * Handles exam and marks management
 */

const { Exam, Mark, Student, Subject, User } = require("../models");
const { Op } = require("sequelize");

exports.createExam = async (req, res) => {
    try {
        const { name, subject_id, class_id, exam_date, total_marks, passing_marks } = req.body;
        const institute_id = req.user.institute_id;

        const exam = await Exam.create({
            institute_id,
            name,
            subject_id,
            class_id,
            exam_date,
            total_marks,
            passing_marks,
        });

        res.status(201).json({
            success: true,
            message: "Exam created successfully",
            data: exam,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getAllExams = async (req, res) => {
    try {
        const { page = 1, limit = 10, class_id, subject_id } = req.query;
        const institute_id = req.user.institute_id;

        const offset = (page - 1) * limit;
        const whereClause = { institute_id };

        if (class_id) whereClause.class_id = class_id;
        if (subject_id) whereClause.subject_id = subject_id;

        const { count, rows } = await Exam.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [["exam_date", "DESC"]],
            include: [
                {
                    model: Subject,
                    attributes: ["id", "name"],
                },
            ],
        });

        res.status(200).json({
            success: true,
            message: "Exams retrieved successfully",
            data: {
                exams: rows,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(count / limit),
                },
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.enterMarks = async (req, res) => {
    try {
        const { exam_id, student_id, marks_obtained } = req.body;
        const institute_id = req.user.institute_id;

        // Find existing mark or create
        let mark = await Mark.findOne({
            where: {
                institute_id,
                exam_id,
                student_id
            }
        });

        if (mark) {
            mark.marks_obtained = marks_obtained;
            await mark.save();
        } else {
            mark = await Mark.create({
                institute_id,
                exam_id,
                student_id,
                marks_obtained,
            });
        }

        res.status(201).json({
            success: true,
            message: "Marks saved successfully",
            data: mark,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getStudentResults = async (req, res) => {
    try {
        const { student_id } = req.params;
        const institute_id = req.user.institute_id;

        const marks = await Mark.findAll({
            where: { student_id, institute_id },
            include: [
                {
                    model: Exam,
                    attributes: ["id", "name", "total_marks", "passing_marks", "exam_date"],
                    include: [
                        {
                            model: Subject,
                            attributes: ["name"],
                        },
                    ],
                },
            ],
            order: [[Exam, "exam_date", "DESC"]],
        });

        res.status(200).json({
            success: true,
            message: "Student results retrieved successfully",
            data: marks,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = exports;
