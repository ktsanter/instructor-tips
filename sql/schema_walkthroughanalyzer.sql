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
  
  primary key (domainid)
);

create table criterion
(
  criterionid         int unsigned not null AUTO_INCREMENT,
  criteriontext       varchar(300) not null,
  domainid            int unsigned not null,
  
  primary key (criterionid),
  constraint foreign key (domainid) references domaininfo (domainid) on delete cascade
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
#-- initial data
#--------------------------------------------------------------------------
select "loading initial data" as comment;

insert into domaininfo (domainnumber, domaindescription) values (0, "General");
insert into domaininfo (domainnumber, domaindescription) values (1, "Planning and Preparation");
insert into domaininfo (domainnumber, domaindescription) values (2, "Classroom Environment");
insert into domaininfo (domainnumber, domaindescription) values (3, "Instruction");
insert into domaininfo (domainnumber, domaindescription) values (4, "Professional Responsibilities");
insert into domaininfo (domainnumber, domaindescription) values (5, "Feedback");

insert into criterion (criteriontext, domainid) values (   'Instructor Name', (select domainid from domaininfo where domainnumber = 0 ) );
insert into criterion (criteriontext, domainid) values (   'Instructor Supervisor', (select domainid from domaininfo where domainnumber = 0) );
insert into criterion (criteriontext, domainid) values (   'Department', (select domainid from domaininfo where domainnumber = 0) );
insert into criterion (criteriontext, domainid) values (   'Instructor Info provided (Photo, Phone Number, Email, Office Hours, Biography)', (select domainid from domaininfo where domainnumber = 1) );
insert into criterion (criteriontext, domainid) values (   'Daily Logins by Instructor', (select domainid from domaininfo where domainnumber = 2) );
insert into criterion (criteriontext, domainid) values (   'Discussion Board Presence (At least 1-3 Posts Per Board)', (select domainid from domaininfo where domainnumber = 3) );
insert into criterion (criteriontext, domainid) values (   'Feedback to Students within 72 Hours', (select domainid from domaininfo where domainnumber = 3) );
insert into criterion (criteriontext, domainid) values (   'Escalate to Instructor Supervisor', (select domainid from domaininfo where domainnumber = 5) );
insert into criterion (criteriontext, domainid) values (   'Accurate Presentation of Content (Teacher Resources Provided)', (select domainid from domaininfo where domainnumber = 3) );
insert into criterion (criteriontext, domainid) values (   'Active Student Participation', (select domainid from domaininfo where domainnumber = 2) );
insert into criterion (criteriontext, domainid) values (   'Actively Participates in Meetings and PD Activities', (select domainid from domaininfo where domainnumber = 4) );
insert into criterion (criteriontext, domainid) values (   'Additional Feedback', (select domainid from domaininfo where domainnumber = 5) );
insert into criterion (criteriontext, domainid) values (   'App Created By', (select domainid from domaininfo where domainnumber = 0) );
insert into criterion (criteriontext, domainid) values (   'Appropriate Pacing (All Pacing Guides Present)', (select domainid from domaininfo where domainnumber = 3) );
insert into criterion (criteriontext, domainid) values (   'Areas of Growth', (select domainid from domaininfo where domainnumber = 5) );
insert into criterion (criteriontext, domainid) values (   'Areas of Strength', (select domainid from domaininfo where domainnumber = 5) );
insert into criterion (criteriontext, domainid) values (   'Attendance at COM', (select domainid from domaininfo where domainnumber = 4) );
insert into criterion (criteriontext, domainid) values (   'Attendance at Department Meetings (At Least 2', (select domainid from domaininfo where domainnumber = 3) );
insert into criterion (criteriontext, domainid) values (   'Clear Standards for Student Work (Rubrics and Grading Criteria)', (select domainid from domaininfo where domainnumber = 3) );
insert into criterion (criteriontext, domainid) values (   'Clearly Outlined Expectations in Welcome Letter', (select domainid from domaininfo where domainnumber = 2) );
insert into criterion (criteriontext, domainid) values (   'Completed ESRs', (select domainid from domaininfo where domainnumber = 4) );
insert into criterion (criteriontext, domainid) values (   'Contact Lead about Course Concerns', (select domainid from domaininfo where domainnumber = 4) );
insert into criterion (criteriontext, domainid) values (   'Contact with Guardians', (select domainid from domaininfo where domainnumber = 4) );
insert into criterion (criteriontext, domainid) values (   'Course/ Section Title', (select domainid from domaininfo where domainnumber = 0) );
insert into criterion (criteriontext, domainid) values (   'Created', (select domainid from domaininfo where domainnumber = 0) );
insert into criterion (criteriontext, domainid) values (   'Created By', (select domainid from domaininfo where domainnumber = 0) );
insert into criterion (criteriontext, domainid) values (   'Engages with Other Team Members Regularly', (select domainid from domaininfo where domainnumber = 4) );
insert into criterion (criteriontext, domainid) values (   'Exceptional Student Report (ESR) is updated', (select domainid from domaininfo where domainnumber = 1) );
insert into criterion (criteriontext, domainid) values (   'Explaining/Modeling Procedures (Evidence of Re-teaching)', (select domainid from domaininfo where domainnumber = 3) );
insert into criterion (criteriontext, domainid) values (   'Growth Mindset Evident through Interactions', (select domainid from domaininfo where domainnumber = 4) );
insert into criterion (criteriontext, domainid) values (   'Hard Work Expected (Indicated in Context of Feedback and Announcements)', (select domainid from domaininfo where domainnumber = 2) );
insert into criterion (criteriontext, domainid) values (   'High-Level Student Thinking (Discussion Boards)', (select domainid from domaininfo where domainnumber = 3) );
insert into criterion (criteriontext, domainid) values (   'Instructional Strategies (Tools and Supplementals)', (select domainid from domaininfo where domainnumber = 3) );
insert into criterion (criteriontext, domainid) values (   'Learning environment', (select domainid from domaininfo where domainnumber = 1) );
insert into criterion (criteriontext, domainid) values (   'Learning focus evident to the students in Additional Resources', (select domainid from domaininfo where domainnumber = 1) );
insert into criterion (criteriontext, domainid) values (   'Learning Goals Clear (Pacing Guidance Provided)', (select domainid from domaininfo where domainnumber = 1) );
insert into criterion (criteriontext, domainid) values (   'Major/Minor Lesson Adjustment (Announcements or Evidence of Reteaching)', (select domainid from domaininfo where domainnumber = 3) );
insert into criterion (criteriontext, domainid) values (   'Mentor Contact for Lack of Student Progress', (select domainid from domaininfo where domainnumber = 4) );
insert into criterion (criteriontext, domainid) values (   'Modeling a Willingness to Grow/Learn to Students', (select domainid from domaininfo where domainnumber = 3) );
insert into criterion (criteriontext, domainid) values (   'Motivational Encouragement (Announcements)', (select domainid from domaininfo where domainnumber = 2) );
insert into criterion (criteriontext, domainid) values (   'Respectful Correction (Feedback Tone)', (select domainid from domaininfo where domainnumber = 2) );
insert into criterion (criteriontext, domainid) values (   'Respond to Student Interests (Announcements)', (select domainid from domaininfo where domainnumber = 3) );
insert into criterion (criteriontext, domainid) values (   'Response to Communication Within 24 Hours', (select domainid from domaininfo where domainnumber = 3) );
insert into criterion (criteriontext, domainid) values (   'Seize Teachable Moment (Evidence of Reteaching)', (select domainid from domaininfo where domainnumber = 3) );
insert into criterion (criteriontext, domainid) values (   'Student Engagement (Attendance/Work Submissions)', (select domainid from domaininfo where domainnumber = 3) );
insert into criterion (criteriontext, domainid) values (   'Student pride in Work (Evidence in Student Submission)', (select domainid from domaininfo where domainnumber = 2) );
insert into criterion (criteriontext, domainid) values (   'Student Self-Assessment (Where Possible/Surveys)', (select domainid from domaininfo where domainnumber = 3) );
insert into criterion (criteriontext, domainid) values (   'Students Appear Highly Motivated to Complete the Course', (select domainid from domaininfo where domainnumber = 3) );
insert into criterion (criteriontext, domainid) values (   'Students Asked to Justify Their Thinking (Discussion Boards)', (select domainid from domaininfo where domainnumber = 3) );
insert into criterion (criteriontext, domainid) values (   'Submit At Least 2 Progress Reports/Term', (select domainid from domaininfo where domainnumber = 4) );
insert into criterion (criteriontext, domainid) values (   'Supplemental resources are provided', (select domainid from domaininfo where domainnumber = 1) );
insert into criterion (criteriontext, domainid) values (   'Teacher Commitment to the Content (Supplemental Resources Provided)', (select domainid from domaininfo where domainnumber = 2) );
insert into criterion (criteriontext, domainid) values (   'Teacher Feedback Promotes Learning', (select domainid from domaininfo where domainnumber = 3) );
insert into criterion (criteriontext, domainid) values (   'Teacher Monitoring (Progress Checks)', (select domainid from domaininfo where domainnumber = 2) );
insert into criterion (criteriontext, domainid) values (   'Use of Resolve to Fix Course Errors', (select domainid from domaininfo where domainnumber = 4) );
insert into criterion (criteriontext, domainid) values (   'Used to Deepen Understanding (Discussion Boards)', (select domainid from domaininfo where domainnumber = 3) );
insert into criterion (criteriontext, domainid) values (   'Weekly Announcements Posted (Teacher Feed)', (select domainid from domaininfo where domainnumber = 2) );

