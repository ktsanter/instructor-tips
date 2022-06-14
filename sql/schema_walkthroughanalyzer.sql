#-----------------------------------------------------------------
#-- create DB for Walkthrough analyzer
#-----------------------------------------------------------------
select "creating roster manager db" as comment;

DROP DATABASE IF EXISTS walkthroughanalyzer;
CREATE DATABASE walkthroughanalyzer;
USE walkthroughanalyzer;

#-----------------------------------------------------------------
#-- tables
#-----------------------------------------------------------------
select "creating tables" as comment;

create table domaininfo
(
  domainid            int unsigned not null AUTO_INCREMENT,
  domainnumber        int unsigned not null,
  domaindescription   varchar(100) not null,
  
  primary key (domainid),
  constraint unique(domainnumber)
);

create table criterion
(
  criterionid         int unsigned not null AUTO_INCREMENT,
  criteriontext       varchar(300) not null,
  domainid            int unsigned not null,
  indexwithindomain   int unsigned not null,
  
  primary key (criterionid),
  constraint foreign key (domainid) references domaininfo (domainid) on delete cascade
);

create table walkthroughset
(
  walkthroughsetid    int unsigned not null AUTO_INCREMENT,
  userid              int unsigned not null,
  walkthroughsetname  varchar(400),
  
  primary key (walkthroughsetid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade,
  constraint unique(walkthroughsetname)
);

create table walkthroughsetselection
(
  walkthroughsetselectionid    int unsigned not null AUTO_INCREMENT,
  userid                       int unsigned not null,
  walkthroughsetid             int unsigned not null,
  
  primary key (walkthroughsetselectionid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade,
  constraint foreign key (walkthroughsetid) references walkthroughset (walkthroughsetid) on delete cascade,
  constraint unique(userid, walkthroughsetid)
);

create table walkthroughitem
(
  walkthroughitemid   int unsigned not null AUTO_INCREMENT,
  walkthroughsetid    int unsigned not null,
  criterionid         int unsigned not null,
  itemvalue           varchar(20) not null,
  itemdate            varchar(20) not null,
  
  primary key (walkthroughitemid),
  constraint foreign key (walkthroughsetid) references walkthroughset (walkthroughsetid) on delete cascade,
  constraint foreign key (criterionid) references criterion (criterionid) on delete cascade
);

create table filtercriterion
(
  filtercriterionid   int unsigned not null AUTO_INCREMENT,
  userid                int unsigned not null,
  criterionid           int unsigned not null,         
  include               int unsigned not null,
  
  primary key (filtercriterionid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade,
  constraint foreign key (criterionid) references criterion (criterionid) on delete cascade,
  constraint unique(userid, criterionid)
);

create table filterempty
(
  filteremptyid  int unsigned not null AUTO_INCREMENT,
  userid         int unsigned not null,
  hideempty      int unsigned not null,         
  
  primary key (filteremptyid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade,
  constraint unique(userid)
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

DELIMITER //
create procedure add_walkthroughset(in user_Id int, in dataset_Name varchar(200))
begin
  insert into walkthroughset(
    userid, 
    walkthroughsetname
  ) values (
    user_Id,
    dataset_Name
  );
  
  select LAST_INSERT_ID() as walkthroughsetid;
end;
//
DELIMITER ;

#--------------------------------------------------------------------------
#-- initial data
#--------------------------------------------------------------------------
select "loading initial data" as comment;

insert into domaininfo (domainnumber, domaindescription) values (0, "General");
insert into domaininfo (domainnumber, domaindescription) values (1, "Planning and Preparation");
insert into domaininfo (domainnumber, domaindescription) values (2, "Classroom Environment");
insert into domaininfo (domainnumber, domaindescription) values (3, "Instruction");
insert into domaininfo (domainnumber, domaindescription) values (4, "Professional Responsibilities");
insert into domaininfo (domainnumber, domaindescription) values (5, "Feedback");

insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Learning focus evident to the students in Additional Resources',
	(select domainid from domaininfo where domainnumber = 1),
	1
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Exceptional Student Report (ESR) is updated',
	(select domainid from domaininfo where domainnumber = 1),
	2
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Supplemental resources are provided',
	(select domainid from domaininfo where domainnumber = 1),
	3
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Instructor Info provided (Photo, Phone Number, Email, Office Hours, Biography)',
	(select domainid from domaininfo where domainnumber = 1),
	4
);

insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Weekly Announcements Posted (Teacher Feed)',
	(select domainid from domaininfo where domainnumber = 2),
	1
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Respectful Correction (Feedback Tone)',
	(select domainid from domaininfo where domainnumber = 2),
	2
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Teacher Monitoring (Progress Checks)',
	(select domainid from domaininfo where domainnumber = 2),
	3
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Hard Work Expected (Indicated in Context of Feedback and Announcements)',
	(select domainid from domaininfo where domainnumber = 2),
	4
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Student pride in Work (Evidence in Student Submission)',
	(select domainid from domaininfo where domainnumber = 2),
	5
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Motivational Encouragement (Announcements)',
	(select domainid from domaininfo where domainnumber = 2),
	6
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Teacher Commitment to the Content (Supplemental Resources Provided)',
	(select domainid from domaininfo where domainnumber = 2),
	7
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Clearly Outlined Expectations in Welcome Letter',
	(select domainid from domaininfo where domainnumber = 2),
	8
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Daily Logins by Instructor',
	(select domainid from domaininfo where domainnumber = 2),
	9
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Active Student Participation',
	(select domainid from domaininfo where domainnumber = 2),
	10
);

insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Learning Goals Clear (Pacing Guidance Provided)',
	(select domainid from domaininfo where domainnumber = 3),
	1
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Instructional Strategies (Tools and Supplementals)',
	(select domainid from domaininfo where domainnumber = 3),
	2
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Explaining/Modeling Procedures (Evidence of Re-teaching)',
	(select domainid from domaininfo where domainnumber = 3),
	3
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Accurate Presentation of Content (Teacher Resources Provided)',
	(select domainid from domaininfo where domainnumber = 3),
	4
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Used to Deepen Understanding (Discussion Boards)',
	(select domainid from domaininfo where domainnumber = 3),
	5
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Students Asked to Justify Their Thinking (Discussion Boards)',
	(select domainid from domaininfo where domainnumber = 3),
	6
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Discussion Board Presence (At least 1-3 Posts Per Board)',
	(select domainid from domaininfo where domainnumber = 3),
	7
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'High-Level Student Thinking (Discussion Boards)',
	(select domainid from domaininfo where domainnumber = 3),
	8
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Appropriate Pacing (All Pacing Guides Present)',
	(select domainid from domaininfo where domainnumber = 3),
	9
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Student Engagement (Attendance/Work Submissions)',
	(select domainid from domaininfo where domainnumber = 3),
	10
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Students Appear Highly Motivated to Complete the Course',
	(select domainid from domaininfo where domainnumber = 3),
	11
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Clear Standards for Student Work (Rubrics and Grading Criteria)',
	(select domainid from domaininfo where domainnumber = 3),
	12
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Feedback to Students within 72 Hours',
	(select domainid from domaininfo where domainnumber = 3),
	13
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Teacher Feedback Promotes Learning',
	(select domainid from domaininfo where domainnumber = 3),
	14
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Student Self-Assessment (Where Possible/Surveys)',
	(select domainid from domaininfo where domainnumber = 3),
	15
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Seize Teachable Moment (Evidence of Reteaching)',
	(select domainid from domaininfo where domainnumber = 3),
	16
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Major/Minor Lesson Adjustment (Announcements or Evidence of Reteaching)',
	(select domainid from domaininfo where domainnumber = 3),
	17
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Response to Communication Within 24 Hours',
	(select domainid from domaininfo where domainnumber = 3),
	18
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Modeling a Willingness to Grow/Learn to Students',
	(select domainid from domaininfo where domainnumber = 3),
	19
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Respond to Student Interests (Announcements)',
	(select domainid from domaininfo where domainnumber = 3),
	20
);

insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Use of Resolve to Fix Course Errors',
	(select domainid from domaininfo where domainnumber = 4),
	1
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Growth Mindset Evident through Interactions',
	(select domainid from domaininfo where domainnumber = 4),
	2
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Contact Lead about Course Concerns',
	(select domainid from domaininfo where domainnumber = 4),
	3
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Submit At Least 2 Progress Reports/Term',
	(select domainid from domaininfo where domainnumber = 4),
	5
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Completed ESRs',
	(select domainid from domaininfo where domainnumber = 4),
	5
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Contact with Guardians',
	(select domainid from domaininfo where domainnumber = 4),
	6
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Mentor Contact for Lack of Student Progress',
	(select domainid from domaininfo where domainnumber = 4),
	7
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Engages with Other Team Members Regularly',
	(select domainid from domaininfo where domainnumber = 4),
	8
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Attendance at Department Meetings (At Least 2',
	(select domainid from domaininfo where domainnumber = 4),
	9
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Actively Participates in Meetings and PD Activities',
	(select domainid from domaininfo where domainnumber = 4),
	10
);
insert into criterion (criteriontext, domainid, indexwithindomain) values ( 
  'Attendance at COM',
	(select domainid from domaininfo where domainnumber = 4),
	11
);