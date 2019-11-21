USE instructortips;

DELETE FROM usertipfilter;
DELETE FROM tipstatus;
DELETE FROM userprivilege;
DELETE FROM privilege;
DELETE FROM user;
DELETE FROM usercourse;
DELETE FROM course;
DELETE FROM term;
DELETE FROM termgroup;
DELETE FROM tip;
DELETE FROM mappedtip;
DELETE from usertipstatus;

#-------------------------------------------------------------
#-- privilege
#-------------------------------------------------------------
load data local infile 'initial_load_data/privilege.txt'
into table privilege
FIELDS TERMINATED BY '|'
LINES TERMINATED BY '\r\n'
(privilegename);

#-------------------------------------------------------------
#-- user
#-------------------------------------------------------------
load data local infile 'initial_load_data/user.txt'
into table user
FIELDS TERMINATED BY '|'
LINES TERMINATED BY '\r\n'
(usershortname, username);

#-------------------------------------------------------------
#-- userprivilege
#-------------------------------------------------------------
INSERT INTO userprivilege (userid, privilegeid)
  SELECT user.userid, privilege.privilegeid 
  FROM user, privilege
  WHERE user.usershortname = 'ksanter' and privilege.privilegename = 'superadmin';
INSERT INTO userprivilege (userid, privilegeid)
  SELECT user.userid, privilege.privilegeid 
  FROM user, privilege
  WHERE user.usershortname = 'nsanter' and privilege.privilegename = 'admin';
INSERT INTO userprivilege (userid, privilegeid)
  SELECT user.userid, privilege.privilegeid 
  FROM user, privilege
  WHERE user.usershortname = 'bubba' and privilege.privilegename = 'lead';
INSERT INTO userprivilege (userid, privilegeid)
  SELECT user.userid, privilege.privilegeid 
  FROM user, privilege
  WHERE user.usershortname = 'carlos' and privilege.privilegename = 'instructor';

#-------------------------------------------------------------
#-- termgroup
#-------------------------------------------------------------
load data local infile 'initial_load_data/termgroup.txt'
into table termgroup
FIELDS TERMINATED BY '|'
LINES TERMINATED BY '\r\n'
(termgroupname, termlength);

#-------------------------------------------------------------
#-- term
#-------------------------------------------------------------
INSERT INTO term (termname, termgroupid) SELECT 'Sem 1', termgroupid FROM termgroup where termgroupname = 'semester';
INSERT INTO term (termname, termgroupid) SELECT 'Sem 2', termgroupid FROM termgroup where termgroupname = 'semester';
INSERT INTO term (termname, termgroupid) SELECT 'Tri 1', termgroupid FROM termgroup where termgroupname = 'trimester';
INSERT INTO term (termname, termgroupid) SELECT 'Tri 2', termgroupid FROM termgroup where termgroupname = 'trimester';
INSERT INTO term (termname, termgroupid) SELECT 'Tri 3', termgroupid FROM termgroup where termgroupname = 'trimester';
INSERT INTO term (termname, termgroupid) SELECT 'Summer', termgroupid FROM termgroup where termgroupname = 'summer';

#-------------------------------------------------------------
#-- course
#-------------------------------------------------------------
load data local infile 'initial_load_data/course.txt'
into table course
FIELDS TERMINATED BY '|'
LINES TERMINATED BY '\r\n'
(coursename, ap);

#-------------------------------------------------------------
#-- usercourse
#-------------------------------------------------------------

#--- "all-courses", public, all terms
INSERT INTO usercourse (userid, courseid, termgroupid) 
SELECT NULL as userid, NULL as courseid, termgroupid
FROM termgroup;

#--- "all-courses", private, all terms
INSERT INTO usercourse (userid, courseid, termgroupid) 
SELECT userid, NULL AS courseid, termgroupid
FROM termgroup, user
WHERE termgroup.termgroupname = 'semester';

#--- course-specific, public, all terms
INSERT INTO usercourse (userid, courseid, termgroupid) 
SELECT NULL as userid, courseid, termgroupid
FROM course, termgroup
WHERE termgroup.termgroupname = 'semester';

INSERT INTO usercourse (userid, courseid, termgroupid) 
SELECT NULL as userid, courseid, termgroupid
FROM course, termgroup
WHERE termgroup.termgroupname in ('trimester', 'summer')
  AND course.ap = false;
  
#-------------------------------------------------------------
#-- tipstatus
#-------------------------------------------------------------
load data local infile 'initial_load_data/tipstatus.txt'
into table tipstatus
FIELDS TERMINATED BY '|'
LINES TERMINATED BY '\r\n'
(tipstatusname);

#-------------------------------------------------------------
#-- tip
#-------------------------------------------------------------
#--- load shared general tips from Instructors Corner
/*
load data local infile 'tipdata_allcourses_public.txt'
into table tip
FIELDS TERMINATED BY '|'
LINES TERMINATED BY '\r\n'
(tiptext)
set userid = null;
*/

#-- public, all-courses tips
INSERT INTO tip (tiptext, userid) VALUES ('shared all-courses announcement 001',  NULL);
INSERT INTO tip (tiptext, userid) VALUES ('shared all-courses announcement 002',  NULL);
INSERT INTO tip (tiptext, userid) VALUES ('shared all-courses announcement 003',  NULL);

#-- TODO: figure out how to automate this?
#-- private, all-courses tips
INSERT INTO tip (tiptext, userid) SELECT 'ksanter all-courses announcement 001', user.userid FROM user WHERE user.usershortname = 'ksanter';
INSERT INTO tip (tiptext, userid) SELECT 'ksanter all-courses announcement 002', user.userid FROM user WHERE user.usershortname = 'ksanter';
INSERT INTO tip (tiptext, userid) SELECT 'ksanter all-courses announcement 003', user.userid FROM user WHERE user.usershortname = 'ksanter';
INSERT INTO tip (tiptext, userid) SELECT 'carlos all-courses announcement 001', user.userid FROM user WHERE user.usershortname = 'carlos';
INSERT INTO tip (tiptext, userid) SELECT 'carlos all-courses announcement 002', user.userid FROM user WHERE user.usershortname = 'carlos';

#-- public, course-specific tips 
INSERT INTO tip(tiptext, userid) VALUES ('shared Java A tip 001', NULL);
INSERT INTO tip(tiptext, userid) VALUES ('shared Java A tip 002', NULL);
INSERT INTO tip(tiptext, userid) VALUES ('shared Web Design tip 001', NULL);
INSERT INTO tip(tiptext, userid) VALUES ('shared Web Design tip 002', NULL);

#-------------------------------------------------------------
#-- mappedtip
#-------------------------------------------------------------
#-- temporary mapping for testing - figure out robust strategy

#--- public, all-courses tips
INSERT INTO mappedtip (tipid, usercourseid, week)
  SELECT tipid, usercourseid, 0
  FROM tip, usercourse
  WHERE tip.tiptext LIKE '%all-courses%'
    AND tip.userid IS NULL
    AND usercourse.userid IS NULL
    AND usercourse.courseid IS NULL;

#-- private, all-courses tips
/*
INSERT INTO mappedtip (tipid, usercourseid, week)
  SELECT tipid, usercourseid, 0
  FROM tip, usercourse
  WHERE tip.tiptext LIKE '%all-courses%'
   AND usercourse.userid = tip.userid
   AND usercourse.courseid IS NULL;
*/

#-- public, course-specific tips 
select "public, course-specific tips";
INSERT INTO mappedtip (tipid, usercourseid, week)
  SELECT tipid, usercourseid, 0
  FROM tip, usercourse, course
  WHERE tip.tiptext LIKE '%java%'
    AND tip.userid IS NULL
    AND usercourse.userid IS NULL
    AND usercourse.courseid = course.courseid
    AND course.coursename like '%java prog%';

INSERT INTO mappedtip (tipid, usercourseid, week)
  SELECT tipid, usercourseid, 0
  FROM tip, usercourse, course, termgroup
  WHERE tip.tiptext LIKE '%web design%'
    AND tip.userid IS NULL
    AND usercourse.userid IS NULL
    AND usercourse.courseid = course.courseid
    AND course.coursename like '%basic web design%'
    and usercourse.termgroupid = termgroup.termgroupid
    and termgroup.termgroupname = 'semester';

#-- make a variety of weeks
select "changing mappedtip weeks";
UPDATE mappedtip, tip SET week = 1 WHERE mappedtip.tipid = tip.tipid AND tiptext like '%001';
UPDATE mappedtip, tip SET week = 2 WHERE mappedtip.tipid = tip.tipid AND tiptext like '%002';
UPDATE mappedtip, tip SET week = 3 WHERE mappedtip.tipid = tip.tipid AND tiptext like '%003';