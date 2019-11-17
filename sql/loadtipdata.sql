USE instructortips;

DELETE from usertipstatus;
DELETE FROM mappedtip;
DELETE FROM tip;

#----------- Tips ------------------------
#--- load shared general tips from Instructors Corner
/*
load data local infile 'tipdata_allcourses_public.txt'
into table tip
FIELDS TERMINATED BY '|'
LINES TERMINATED BY '\r\n'
(tiptext)
set userid = null;
*/

#-----------------------------------------------------------------------
#--- test tip data
#-----------------------------------------------------------------------

#-- public, all-courses tips
INSERT INTO tip (tiptext, userid) VALUES ('shared all-courses announcement 001',  NULL);
INSERT INTO tip (tiptext, userid) VALUES ('shared all-courses announcement 002',  NULL);
INSERT INTO tip (tiptext, userid) VALUES ('shared all-courses announcement 003',  NULL);

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

#-- private course-specific tips
INSERT INTO tip (tiptext, userid) SELECT 'ksanter Java A tip 001', user.userid FROM user WHERE user.usershortname = 'ksanter';
INSERT INTO tip (tiptext, userid) SELECT 'ksanter Java A tip 002', user.userid FROM user WHERE user.usershortname = 'ksanter';
INSERT INTO tip (tiptext, userid) SELECT 'ksanter Web design tip 001', user.userid FROM user WHERE user.usershortname = 'ksanter';
INSERT INTO tip (tiptext, userid) SELECT 'ksanter Web design tip 002', user.userid FROM user WHERE user.usershortname = 'ksanter';
INSERT INTO tip (tiptext, userid) SELECT 'carlos Java A tip 001', user.userid FROM user WHERE user.usershortname = 'carlos';
INSERT INTO tip (tiptext, userid) SELECT 'carlos Java A tip 002', user.userid FROM user WHERE user.usershortname = 'carlos';
INSERT INTO tip (tiptext, userid) SELECT 'carlos Web Design tip 001', user.userid FROM user WHERE user.usershortname = 'carlos';
INSERT INTO tip (tiptext, userid) SELECT 'carlos Web Design tip 002', user.userid FROM user WHERE user.usershortname = 'carlos';

#--------------------------------------------------
#--- tip mapping
#-----------------------------------------------------------------------

#--- public, all-courses tips
INSERT INTO mappedtip (tipid, usercourseid, week)
  SELECT tipid, usercourseid, 0
  FROM tip, usercourse
  WHERE tip.tiptext LIKE '%all-courses%'
    AND tip.userid IS NULL
    AND usercourse.userid IS NULL
    AND usercourse.courseid IS NULL;

#-- private, all-courses tips
INSERT INTO mappedtip (tipid, usercourseid, week)
  SELECT tipid, usercourseid, 0
  FROM tip, usercourse
  WHERE tip.tiptext LIKE '%all-courses%'
   AND usercourse.userid = tip.userid
   AND usercourse.courseid IS NULL;

#-- public, course-specific tips 
INSERT INTO mappedtip (tipid, usercourseid, week)
  SELECT tipid, usercourseid, 0
  FROM tip, usercourse, course
  WHERE tip.tiptext LIKE '%java%'
    AND tip.userid IS NULL
    AND usercourse.userid IS NULL
    AND usercourse.courseid = course.courseid
    AND course.coursename like '%java%';

INSERT INTO mappedtip (tipid, usercourseid, week)
  SELECT tipid, usercourseid, 0
  FROM tip, usercourse, course
  WHERE tip.tiptext LIKE '%web design%'
    AND tip.userid IS NULL
    AND usercourse.userid IS NULL
    AND usercourse.courseid = course.courseid
    AND course.coursename like '%web design%';

#-- private course-specific tips
INSERT INTO mappedtip (tipid, usercourseid, week)
  SELECT tipid, usercourseid, 0
  FROM tip, usercourse, course
  WHERE tip.tiptext LIKE '%java%'
    AND usercourse.userid = tip.userid
    AND usercourse.courseid = course.courseid
    AND course.coursename like '%java%';

INSERT INTO mappedtip (tipid, usercourseid, week)
  SELECT tipid, usercourseid, 0
  FROM tip, usercourse, course
  WHERE tip.tiptext LIKE '%web design%'
    AND usercourse.userid = tip.userid
    AND usercourse.courseid = course.courseid
    AND course.coursename like '%web design%';

#-- make a variety of weeks
UPDATE mappedtip, tip SET week = 1 WHERE mappedtip.tipid = tip.tipid AND tiptext like '%001';
UPDATE mappedtip, tip SET week = 2 WHERE mappedtip.tipid = tip.tipid AND tiptext like '%002';
UPDATE mappedtip, tip SET week = 3 WHERE mappedtip.tipid = tip.tipid AND tiptext like '%003';

/*  
#--- course specific tip mapping
INSERT INTO mappedtip (tipid, usercourseid, week) 
  SELECT tipid, usercourseid, 0
  FROM tip, usercourse, termgroup
  WHERE usercourse.termgroupid = termgroup.termgroupid
    AND termgroupname in ('semester', 'trimester')
    AND tip.tiptext like '%java%';
    
INSERT INTO mappedtip (tipid, usercourseid, week) 
  SELECT tipid, usercourseid, 0
  FROM tip, usercourse, termgroup
  WHERE usercourse.termgroupid = termgroup.termgroupid
    AND termgroupname in ('semester')
    AND tip.tiptext like '%web design%';
    
UPDATE mappedtip, tip SET week = 1 WHERE mappedtip.tipid = tip.tipid AND tiptext like '%001';
UPDATE mappedtip, tip SET week = 2 WHERE mappedtip.tipid = tip.tipid AND tiptext like '%002';
UPDATE mappedtip, tip SET week = 3 WHERE mappedtip.tipid = tip.tipid AND tiptext like '%003';
/*

#---- add all course tips
INSERT INTO mappedtip (tipid, userid, termgroupid, courseid, week)
  SELECT tipid, userid, termgroupid, courseid, 0
  FROM tip, termgroup, course
  WHERE termgroupname = 'semester'
    AND coursename LIKE '%java%'
    AND tip.tiptext LIKE '%java%';

INSERT INTO mappedtip (tipid, userid, termgroupid, courseid, week)
  SELECT tipid, userid, termgroupid, courseid, 0
  FROM tip, termgroup, course
  WHERE termgroupname = 'trimester'
    AND coursename LIKE '%java%'
    AND tip.tiptext LIKE '%java%';

INSERT INTO mappedtip (tipid, userid, termgroupid, courseid, week)
  SELECT tipid, userid, termgroupid, courseid, 0
  FROM tip, termgroup, course
  WHERE termgroupname = 'semester'
    AND coursename LIKE '%web design%'
    AND tip.tiptext LIKE '%web design%';

UPDATE mappedtip, tip SET week = 1 WHERE mappedtip.tipid = tip.tipid AND tiptext like '%001';
UPDATE mappedtip, tip SET week = 2 WHERE mappedtip.tipid = tip.tipid AND tiptext like '%002';
UPDATE mappedtip, tip SET week = 3 WHERE mappedtip.tipid = tip.tipid AND tiptext like '%003';
UPDATE mappedtip, tip SET week = 4 WHERE mappedtip.tipid = tip.tipid AND tiptext like '%004';
*/