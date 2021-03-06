delete from configuration;
delete from course;
delete from exam;
delete from proctoring;
delete from retake;
delete from resubmission;
delete from generalkeypoint;

insert into exam(examdescription) values ('There is no midterm or final.');
insert into exam(examdescription) values ('There is a password-protected final exam. The password will be distributed to mentors early in the semester');
insert into exam(examdescription) values ('There is a midterm and a final, and both are password-protected.  Passwords will be distributed to mentors early in the semester.');

insert into proctoring(proctoringdescription) values ('Proctoring for assessments (tests, quizzes, etc.) is at the discretion of your school but strongly encouraged.');
insert into proctoring(proctoringdescription) values ('Proctoring is required for the final exam.');
insert into proctoring(proctoringdescription) values ('Proctoring is required for the midterm and final exams.');

insert into retake(retakedescription) values ('There are no retakes for assessments except in the case of technical difficulties (at the instructor\'s discretion)');
insert into retake(retakedescription) values ('There are no retakes for assessments except in the case of technical difficulties (at the instructor\'s discretion) - refer to the AP course policies');

insert into resubmission(resubmissiondescription) values ('All programming assignments can be resubmitted.  Instructors may apply a limit and/or resubmission requirements at their discretion.');
insert into resubmission(resubmissiondescription) values ('All programming assignments can be resubmitted.  Instructors may apply a limit and/or resubmission requirements at their discretion - refer to the AP course policies.');
insert into resubmission(resubmissiondescription) values ('Assignments may be resubmitted only at the instructor\'s discretion');

insert into generalkeypoint(keypoint, ap, student, mentor) values ('Details for policies can be found in the <a href="https://michiganvirtual.org/about/support/knowledge-base/advanced-placement-course-policy/" target="_blank"> Advanced Placement Course Policy</a> document.', true, true, true);
insert into generalkeypoint(keypoint, ap, student, mentor) values ('General grading policies (other than those for AP courses) can be found on the 
<a href="https://michiganvirtual.org/about/support/knowledge-base/michigan-virtual-grading-policy-and-expectations/" target="_blank"> Grading Policy and Expectations</a> page', true, true, true);
insert into generalkeypoint(keypoint, ap, student, mentor) values ('There are <strong> weekly due dates</strong> for assignments, with penalties for late assignments.', true, true, true);

insert into generalkeypoint(keypoint, ap, student, mentor) values ('There are no due dates other than the end of the semester, however students should strive to follow the pacing guide.', false, true, true);
insert into generalkeypoint(keypoint, ap, student, mentor) values ('Details for grading polices can be found on the  <a href="https://michiganvirtual.org/about/support/knowledge-base/michigan-virtual-grading-policy-and-expectations/", target="_blank"> Grading Policy and Expectations</a> page', false, true, true);
