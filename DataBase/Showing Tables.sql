
use student_saas;

SELECT * FROM plans;

SELECT * FROM institutes;

SELECT * FROM users;

SELECT * FROM faculty;

SELECT * FROM students;

SELECT * FROM classes;

SELECT * FROM subjects;

SELECT * FROM plans;

SELECT * FROM attendance;

SELECT * FROM fees_structure;

SELECT * FROM fees_structures;

SELECT * FROM feesstructures;

SELECT * FROM payments;

SELECT * FROM exams;

SELECT * FROM marks;

SELECT * FROM subscriptions;

SELECT * FROM announcements;


SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE students;
SET FOREIGN_KEY_CHECKS = 1;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE marks;
DROP TABLE students;
DROP TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

DESCRIBE faculty;

