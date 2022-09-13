#-----------------------------------------------------------------
#-- create DB for Course Policies
#-----------------------------------------------------------------
select "creating course policies db" as comment;

DROP DATABASE IF EXISTS coursepolicies;
CREATE DATABASE coursepolicies;
USE coursepolicies;

#-----------------------------------------------------------------
#-- tables
#-----------------------------------------------------------------
select "creating tables" as comment;

create table contact
(
  contactid          int unsigned not null AUTO_INCREMENT,
  contentdescriptor  varchar(50) not null,
  firstname          varchar(50) not null,
  lastname           varchar(50) not null,
  phone              varchar(20) not null,
  email              varchar(50) not null,
  templatebase       varchar(50) not null,
  
  primary key (contactid),
  constraint unique(contentdescriptor)  
);

create table resourcelink
(
  resourcelinkid     int unsigned not null AUTO_INCREMENT,
  templateitem       varchar(50) not null,
  restriction        varchar(20) not null,
  linktext           varchar(50) not null,
  linkurl            varchar(300) not null,
  
  primary key (resourcelinkid),
  constraint unique(templateitem)  
);

create table expectation
(
  expectationid     int unsigned not null AUTO_INCREMENT,
  target            varchar(20) not null,
  expectationtext   varchar(300) not null,
  restriction       varchar(20) not null,
  ordering          int unsigned not null,
  
  primary key (expectationid),
  constraint unique(target, expectationtext)  
);

create table course
(
  courseid          int unsigned not null AUTO_INCREMENT,
  coursename        varchar(100) not null,
  ap                int unsigned not null,
  assessments       varchar(200) not null,
  
  primary key (courseid),
  constraint unique(coursename)  
);

create table keypoint
(
  keypointid        int unsigned not null AUTO_INCREMENT,
  keypointtext      varchar(300) not null,
  category          varchar(30) not null,
  
  primary key (keypointid),
  constraint unique(keypointtext  )  
);

create table coursekeypoint
(
  coursekeypointid   int unsigned not null AUTO_INCREMENT,
  courseid           int unsigned not null,
  keypointid         int unsigned not null,
  ordering           int unsigned not null,
  
  primary key (coursekeypointid),
  constraint unique(courseid, keypointid),
  constraint foreign key (courseid) references course (courseid) on delete cascade,
  constraint foreign key (keypointid) references keypoint (keypointid) on delete cascade
);

#--------------------------------------------------------------------------
#-- triggers
#--------------------------------------------------------------------------
select "creating triggers" as comment;
        
#--------------------------------------------------------------------------
#-- views
#--------------------------------------------------------------------------
select "creating views" as comment;
    
#--------------------------------------------------------------------------
#-- stored procedures
#--------------------------------------------------------------------------
select "creating stored procedures" as comment;

#--------------------------------------------------------------------------
#-- preliminary data
#--------------------------------------------------------------------------
select "loading preliminary data" as comment;

insert into contact (contentdescriptor, firstname, lastname, phone, email, templatebase)
values 
  ("mentor coordinator", "Katie", "Hansen", "(517) 664-5470", "khansen2@michiganvirtual.org", "mentor support"),
  ("special populations coordinator", "Tom", "Ballew", "(517) 999-9999", "tballew@michiganvirtual.org", "special populations");

insert into resourcelink (templateitem, restriction, linktext, linkurl)
values 
  ("customer care", "none", "Customer Care Center", "https://michiganvirtual.org/about/support/" ) ,
  ("mentor page", "none", "Mentor Page", "https://michiganvirtual.org/professionals/mentors/" ),
  ("academic integrity policy", "none", "Academic Integrity Policy", "https://michiganvirtual.org/policies/academic-integrity-policy/" ),
  ("grading policy and expectations", "none", "Grading Policy and Expectations", "https://michiganvirtual.org/about/support/knowledge-base/michigan-virtual-grading-policy-and-expectations" ),
  ("ap policy", "ap", "Advanced Placement Policy", "https://michiganvirtual.org/about/support/knowledge-base/advanced-placement-course-policy" ),
  ("pacing guide", "none", "pacing guide", "https://help.michiganvirtual.org/support/solutions/articles/65000178934-what-activities-assignments-should-i-complete-this-week-" ),
  ("pacing guide (ap csa1)", "ap", "pacing guide", "https://docs.google.com/document/d/1Bi1bLxwn4lAZ5Bw2FCV1qgD1gKm6HSZFFaOCcJ1hrSo/edit?usp=sharing" ),
  ("pacing guide (ap csp1)", "ap", "pacing guide", "https://docs.google.com/document/d/1xa87kkoSw293ZBeWL7bYnwsQhtzmz9WVlXFKFdxyRII/edit?usp=sharing" );
  
insert into expectation(target, restriction, ordering, expectationtext)
values
  ("student", "none", 1, "Log in at least every school day."),
  ("student", "ap", 2, "Be familiar with Michigan Virtual's {ap policy}, especially regarding due dates and late penalties."),
  ("student", "none", 3, "Be familiar with our {grading policy and expectations}."),
  ("student", "non-ap", 4, "Effectively manage time, using the {pacing guide}."),
  ("student", "none", 5, "Be familiar with our {academic integrity policy}."),
  ("student", "none", 6, "Check SLP messages and the Teacher Feed every day."),
  ("student", "none", 7, "Be respectful and considerate when communicating and working with classmates.");
  
  
insert into expectation(target, restriction, ordering, expectationtext)
values
  ("instructor", "none", 1, "Always treat students with respect and friendliness, doing my best to encourage their learning and growth."),
  ("instructor", "none", 2, "Respond to any communication within 24 hours (not counting weekends and holidays)."),
  ("instructor", "non-ap", 3, "Grade all assignments, providing solid feedback, within 72 hours (not counting weekends and holidays)."),
  ("instructor", "ap", 4, "Grade all assignments, providing solid feedback, within 96 hours (not counting weekends and holidays)."),
  ("instructor", "none", 5, "Provide progress reports at least monthly."),
  ("instructor", "none", 6, "Help explain difficult concepts and provide additional support material."),
  ("instructor", "none", 7, "Make weekly posts in the Teacher Feed, with tips, resources, and support."),
  ("instructor", "none", 8, "Be an active member of the class discussions.");

insert into course(coursename, ap, assessments)
values
  ("AP Computer Science Principles", 1, '[\'final exam\']'),
  ("AP Computer Science A", 1, '[\'final exam\']'),
  ("Accounting 1A", 0, '[\'midterm\', \'final exam\']'),
  ("Accounting 1B", 0, '[]'),
  ("Basic Web Design: HTML & CSS", 0, '[\'7.02 Semester Exam\']');
  
insert into keypoint(category, keypointtext)
values
  ("exam", "The midterm and final exam require passwords.  These will be distributed to mentors early in the term"),
  ("exam", "There are no exams requiring passwords for this course."),
  ("exam", "There is a password-protected final exam. The password will be distributed to mentors early in the semester"),
  ("proctoring", "Proctoring (if feasible) is required for the final exam, and strongly encouraged for the other tests and exams"),
  ("retake", "There are no retakes for assessments except in the case of technical difficulties, at the instructor's discretion."),
  ("retake", "All quizzes (but not tests or exams) allow up to 3 retakes"),
  ("resubmit", "All programming assignments can be resubmitted. Instructors may apply a limit and/or resubmission requirements at their discretion."),
  ("resubmit", "Assignments may be resubmitted only at the instructor's discretion."),
  ("ap", "Details for policies can be found in the {ap policy}."),
  ("ap", "There are weekly due dates for assignments, with penalties for late assignments.  Please help your student use the {pacing guide (ap csa1)} effectively."),
  ("ap", "There are weekly due dates for assignments, with penalties for late assignments.  Please help your student use the {pacing guide (ap csp1)} effectively.");

  
