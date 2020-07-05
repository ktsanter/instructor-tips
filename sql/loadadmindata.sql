#------------------------------------------------------------
#-- initial admin data load
#------------------------------------------------------------

select "loading admin data..." as comment;

USE instructortips;

select "deleting from tables" as comment;

DELETE FROM userprivilege;
DELETE FROM privilege;
DELETE FROM user;
DELETE from tipcategory;
DELETE from scheduletip;
DELETE FROM category;
DELETE FROM tip;
DELETE FROM schedule;

#-------------------------------------------------------------
#-- privilege
#-------------------------------------------------------------
select "loading privilege" as comment;

INSERT INTO privilege(privilegename) values('superadmin');
INSERT INTO privilege(privilegename) values('admin');
INSERT INTO privilege(privilegename) values('lead');
INSERT INTO privilege(privilegename) values('instructor');

#-------------------------------------------------------------
#-- user
#-------------------------------------------------------------
select "loading user - disabled" as comment;

#insert into user(usershortname, username, email)
#values ('ksanter', 'Kevin Santer', 'ktsanter2@gmail.com');

#-------------------------------------------------------------
#-- userprivilege
#-------------------------------------------------------------
select "updating userprivilege -disabled" as comment;

#call bumpprivilege();

#-------------------------------------------------------------
#-- category
#-------------------------------------------------------------
select "loading category" as comment;

INSERT INTO category (categorytext) SELECT 'course prep';
INSERT INTO category (categorytext) SELECT 'course launch';
INSERT INTO category (categorytext) SELECT 'check-in / concerns';
INSERT INTO category (categorytext) SELECT 'ESR';
INSERT INTO category (categorytext) SELECT 'engagement';
INSERT INTO category (categorytext) SELECT 'reminder';
INSERT INTO category (categorytext) SELECT 'course end';
INSERT INTO category (categorytext) SELECT 'reflection';

#-------------------------------------------------------------
#-- tip
#-------------------------------------------------------------
select "loading tip" as comment;

drop table if exists tip_staging;

CREATE TABLE tip_staging
(
  tiptext   varchar(1000) NOT NULL ,
  categorytext      varchar(100) NOT NULL 
);

#load data local infile 'initial_load_data/tip.txt'
#into table tip_staging
#FIELDS TERMINATED BY '|'
#LINES TERMINATED BY '\r\n'
#(tiptext, categorytext);

insert into tip_staging (tiptext, categorytext) values ("Ask students how the course is going so far. Check in on what they need from you to be successful. Remind students of their end date and what that means.","check-in / concerns");
insert into tip_staging (tiptext, categorytext) values ("Before beginning the semester, check out [%%the schedule%%](https://docs.google.com/document/d/1vnaFT9yNCRFXIYI2YFl36YACxILQ2OmkBg61liVLYw4/edit?usp=sharing) of department meetings and Byte-Sized PD. Add sessions to your calendar. Your participation is welcome and encouraged!","course prep");
insert into tip_staging (tiptext, categorytext) values ("Check ESRs as you are notified. Apply necessary accommodations in your courses.","ESR");
insert into tip_staging (tiptext, categorytext) values ("Check with students who haven't gotten started working on the course. Let mentors know if students have not started the course yet.","check-in / concerns");
insert into tip_staging (tiptext, categorytext) values ("Complete the [%%Pre-Flight Checklist%%](https://kb.mivu.org/Instructors/Tools/Lists/MVS%20Course%20PreFlight%20Checklist/Item/newifs.aspx?List=1b773237-6c11-4fff-b707-3548855b8ed8&Source=https://kb.mivu.org/Instructors/Tools/SitePages/Course%20Pre-Flight%20Checklists.aspx) for each course once your course is assigned to you.","course prep");
insert into tip_staging (tiptext, categorytext) values ("Consider posting a padlet, discussion post, survey, or other ways of engaging students in their interests beyond the course content. \n\nHow to embed\n- %%[a Padlet](https://drive.google.com/file/d/0B3BY-q2dmkAtWmlseHlUbjd1M2s/view)%%\n- %%[a video recording](https://kb.mivu.org/Instructors/Pages/Multimedia/Camtasia-Relay.aspx)%%\n- %%[an audio recording](https://kb.mivu.org/Instructors/Pages/Blackboard/RecordVoice.aspx)%%\n","engagement");
insert into tip_staging (tiptext, categorytext) values ("Consider offering review sessions for the midterm exam. Let students know how they can contact you for help. (see [Google Voice tutorial](https://www.youtube.com/watch?v=sFFx8F7Fm9M))\n","reminder");
insert into tip_staging (tiptext, categorytext) values ("Consider sending [SLP Messaging Template](https://docs.google.com/presentation/d/1bfq5Go5suE6cXvIxH-t1uYZse3rlGfyLOgbE1s6YMk4/edit?usp=sharing) identifying *Students in Academic Danger*. Message students and mentors who are behind but still able to pass. Let them know what they can do to pass.","check-in / concerns");
insert into tip_staging (tiptext, categorytext) values ("Consider ways to keep students motivated. Send encouraging messages to all students. Reach out with positive notes to students, mentors, and parents (with mentor permission). Congratulate students who are staying on pace.","engagement");
insert into tip_staging (tiptext, categorytext) values ("Update your instructor profile information","course prep");
insert into tip_staging (tiptext, categorytext) values ("Follow up with students who are falling behind. If students have ESRs, update the ESR with relevant information.","check-in / concerns");
insert into tip_staging (tiptext, categorytext) values ("Introduce yourself to your students. This can either be an announcement, video, message, or something else. Be creative! Show them who you are.","course launch");
insert into tip_staging (tiptext, categorytext) values ("Make use of appropriate [SLP messaging templates](https://docs.google.com/presentation/d/1bfq5Go5suE6cXvIxH-t1uYZse3rlGfyLOgbE1s6YMk4/edit?usp=sharing) such as the *End Date Reminder*  template. \n\nFollow up with mentors and parents (with mentor permission) on students who aren't on track to pass.","check-in / concerns");
insert into tip_staging (tiptext, categorytext) values ("Offer opportunities for students to meet with you in order to get back on track or get help with the course. Update interactions in ESR, if applicable.","check-in / concerns");
insert into tip_staging (tiptext, categorytext) values ("Respond to all Unit 0 Discussion Board posts with personalized messages to students.","course launch");
insert into tip_staging (tiptext, categorytext) values ("Respond to Unit 0 *Send Your Instructor a Message* messages with personalized responses to students. Use this as an opportunity to get to know your students and make connections with them. You might also verify that their end date is correct. (see [SLP: Locate Course Start and End Dates](https://michiganvirtual.org/about/support/knowledge-base/slp-locate-course-start-and-end-dates/))","course launch");
insert into tip_staging (tiptext, categorytext) values ("Send all final exam passwords for the course to mentors. Be sure mentors and students understand expectations for final exams and use of passwords.","reminder");
insert into tip_staging (tiptext, categorytext) values ("Send an encouraging message on finishing out the course and completing the final exam.","check-in / concerns");
insert into tip_staging (tiptext, categorytext) values ("Send final exam passwords to mentors (again).","reminder");
insert into tip_staging (tiptext, categorytext) values ("Send out Welcome Letters to students and mentors. Let students know in Welcome Letters, Announcements, or SLP Messaging how to view feedback on their assignments and how to review completed tests.\n- %%[Blackboard: assignment feedback](https://michiganvirtual.org/about/support/knowledge-base/blackboard-assignment-feedback/)%%\n- %%[Blackboard: review completed texts](https://michiganvirtual.org/about/support/knowledge-base/blackboard-review-completed-tests/)%%","course launch");
insert into tip_staging (tiptext, categorytext) values ("Share navigation tools in the course. Be sure students know how to use a Chromebook to save and submit assignments and how to submit assignments in your course (if there are specific parameters). \n- %%[Blackboard: assignments](https://michiganvirtual.org/about/support/knowledge-base/assignments/)%%\n- %%[Blackboard:discussion boards](https://michiganvirtual.org/about/support/knowledge-base/discussion-board/)%%\n- %%[Blackboard: submitting Word documents using a Chromebook](https://michiganvirtual.org/about/support/knowledge-base/blackboard-submitting-word-documents-using-a-chromebook/)%%\n- %%[other KB links](https://michiganvirtual.org/about/support/knowledge-base/category/k-12-student/)%%","course launch");
insert into tip_staging (tiptext, categorytext) values ("Start offering review sessions for the final exam. Let students know how they can contact you for help. ([using Google Voice](https://www.youtube.com/watch?v=sFFx8F7Fm9M))","reminder");
insert into tip_staging (tiptext, categorytext) values ("Start talking about the end of the course to give students perspective. Let them know where they should be and what they can do to get help.","reminder");
insert into tip_staging (tiptext, categorytext) values ("Take a moment to reflect on your teaching. \n- What's going well? \n- What support do you need? \n\nCheck out the [%%department/Byte-Sized PD schedule%%](https://docs.google.com/document/d/1vnaFT9yNCRFXIYI2YFl36YACxILQ2OmkBg61liVLYw4/edit?usp=sharing)  and attend a relevant session, or consider connecting with a colleague for support. Your team is here for your success!","reflection");
insert into tip_staging (tiptext, categorytext) values ("Update the ESR document (at least twice during the term and at the end) with accommodations you've provided and relevant interactions with the student, mentor, and parents","ESR");
insert into tip_staging (tiptext, categorytext) values ("Wrap up the course and %%[finalize grades](https://kb.mivu.org/Instructors/Pages/StudentLearningPortal/SubmitFinalGrades.aspx)%%","course end");
insert into tip_staging (tiptext, categorytext) values ("Reach out to mentors on how students are doing and ways you can offer help to their students in the course [(example letter to mentors)](https://docs.google.com/document/d/1A6CGMuGysiusHCSINCyr0sjfFkVxfS0rDsS5WHF2KPc/edit?usp=sharing)","check-in / concerns");

insert into tip(tiptext, common, userid)
select ts.tiptext, TRUE, NULL
from tip_staging as ts;

#-------------------------------------------------------------
#-- tipcategory
#-------------------------------------------------------------
select "loading tipcategory" as comment;

insert into tipcategory(tipid, categoryid)
select t.tipid, c.categoryid
from 
  tip_staging as ts,
  tip as t,  
  category as c 
  where ts.tiptext = t.tiptext
    and ts.categorytext = c.categorytext;
