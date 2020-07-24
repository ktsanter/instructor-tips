delete from configuration;
delete from course;
delete from exam;
delete from proctoring;
delete from retake;
delete from resubmission;

insert into exam(examdescription) values ('There is no midterm or final.');
insert into exam(examdescription) values ('There is a password-protected final exam.');
insert into exam(examdescription) values ('There is a midterm and a final.  Both are password-protected.');

insert into proctoring(proctoringdescription) values ('Exam proctoring is at the discretion of the school but strongly encouraged.');
insert into proctoring(proctoringdescription) values ('Proctoring is required for all exams.');

insert into retake(retakedescription) values ('There are no retakes for assessments except in the case of technical difficulties (at the instructor\'s discretion)');
insert into retake(retakedescription) values ('There are no retakes for assessments except in the case of technical difficulties (at the instructor\'s discretion) - refer to the AP course policies');

insert into resubmission(resubmissiondescription) values ('All programming assignments can be resubmitted.  Instructors may apply a limit and/or resubmission requirements at their discretion.');
insert into resubmission(resubmissiondescription) values ('All programming assignments can be resubmitted.  Instructors may apply a limit and/or resubmission requirements at their discretion - refer to the AP course policies.');
insert into resubmission(resubmissiondescription) values ('Assignments may be resubmitted only at the instructor\'s discretion');