USE instructortips;

DELETE FROM generaltip;
DELETE FROM tip;

#----------- Tips ------------------------
# shared general tips from Instructors Corner
load data local infile 'generaltipdata.txt'
into table tip
FIELDS TERMINATED BY '|'
LINES TERMINATED BY '\r\n'
(tiptext)
set userid = null;

# shared general tips 
INSERT INTO tip (tiptext, userid) VALUES ('shared general announcement 001',  NULL);
INSERT INTO tip (tiptext, userid) VALUES ('shared general announcement 002',  NULL);
INSERT INTO tip (tiptext, userid) VALUES ('shared general announcement 003',  NULL);

# personal general tips 
INSERT INTO tip (tiptext, userid) SELECT 'ksanter general announcement 001', user.userid FROM user WHERE user.usershortname = 'ksanter';
INSERT INTO tip (tiptext, userid) SELECT 'ksanter general announcement 002', user.userid FROM user WHERE user.usershortname = 'ksanter';
INSERT INTO tip (tiptext, userid) SELECT 'ksanter general announcement 003', user.userid FROM user WHERE user.usershortname = 'ksanter';
INSERT INTO tip (tiptext, userid) SELECT 'carlos general announcement 001', user.userid FROM user WHERE user.usershortname = 'carlos';
INSERT INTO tip (tiptext, userid) SELECT 'carlos general announcement 002', user.userid FROM user WHERE user.usershortname = 'carlos';

# shared course-specific tips 
INSERT INTO tip(tiptext, userid) VALUES ('shared Java A tip 001', NULL);
INSERT INTO tip(tiptext, userid) VALUES ('shared Java A tip 002', NULL);
INSERT INTO tip(tiptext, userid) VALUES ('shared Web Design tip 001', NULL);
INSERT INTO tip(tiptext, userid) VALUES ('shared Web Design tip 002', NULL);

# personal course-specific tips 
INSERT INTO tip (tiptext, userid) SELECT 'ksanter Java A tip 001', user.userid FROM user WHERE user.usershortname = 'ksanter';
INSERT INTO tip (tiptext, userid) SELECT 'ksanter Java A tip 002', user.userid FROM user WHERE user.usershortname = 'ksanter';
INSERT INTO tip (tiptext, userid) SELECT 'ksanter Web design tip 001', user.userid FROM user WHERE user.usershortname = 'ksanter';
INSERT INTO tip (tiptext, userid) SELECT 'ksanter Web design tip 002', user.userid FROM user WHERE user.usershortname = 'ksanter';
INSERT INTO tip (tiptext, userid) SELECT 'carlos Java A tip 001', user.userid FROM user WHERE user.usershortname = 'carlos';
INSERT INTO tip (tiptext, userid) SELECT 'carlos Java A tip 002', user.userid FROM user WHERE user.usershortname = 'carlos';
INSERT INTO tip (tiptext, userid) SELECT 'carlos Web Design tip 001', user.userid FROM user WHERE user.usershortname = 'carlos';
INSERT INTO tip (tiptext, userid) SELECT 'carlos Web Design tip 002', user.userid FROM user WHERE user.usershortname = 'carlos';

#--------------- generaltip ---------------------------------
# add all general tips
INSERT INTO generaltip (tipid, termgroupid, week)
  SELECT tipid, termgroupid, 0
  FROM tip, termgroup
  WHERE termgroup.termgroupname = 'semester'
    AND tip.tiptext LIKE '%general%';
    
INSERT INTO generaltip (tipid, termgroupid, week)
  SELECT tipid, termgroupid, 0
  FROM tip, termgroup
  WHERE termgroup.termgroupname = 'trimester'
    AND tip.tiptext LIKE '%general%';
    
UPDATE generaltip, tip SET week = 1 WHERE generaltip.tipid = tip.tipid AND tiptext like '%001';
UPDATE generaltip, tip SET week = 2 WHERE generaltip.tipid = tip.tipid AND tiptext like '%002';
UPDATE generaltip, tip SET week = 3 WHERE generaltip.tipid = tip.tipid AND tiptext like '%003';
UPDATE generaltip, tip SET week = 4 WHERE generaltip.tipid = tip.tipid AND tiptext like '%004';

#--------------- coursetip ---------------------------------
# add all course tips
INSERT INTO coursetip (tipid, coursetermid, week)
  SELECT tip.tipid, courseterm.coursetermid, 0
  FROM tip, courseterm, termgroup, course
  WHERE termgroup.termgroupname = 'semester'
    AND course.coursename LIKE '%java%'
    AND courseterm.courseid = course.courseid
    AND courseterm.termgroupid = termgroup.termgroupid
    AND tip.tiptext LIKE '%java%';

INSERT INTO coursetip (tipid, coursetermid, week)
  SELECT tip.tipid, courseterm.coursetermid, 0
  FROM tip, courseterm, termgroup, course
  WHERE termgroup.termgroupname = 'semester'
    AND course.coursename LIKE '%web design%'
    AND courseterm.courseid = course.courseid
    AND courseterm.termgroupid = termgroup.termgroupid
    AND tip.tiptext LIKE '%web design%';
    
INSERT INTO coursetip (tipid, coursetermid, week)
  SELECT tip.tipid, courseterm.coursetermid, 0
  FROM tip, courseterm, termgroup, course
  WHERE termgroup.termgroupname = 'trimester'
    AND course.coursename LIKE '%java%'
    AND courseterm.courseid = course.courseid
    AND courseterm.termgroupid = termgroup.termgroupid
    AND tip.tiptext LIKE '%java%';

UPDATE coursetip, tip SET week = 1 WHERE coursetip.tipid = tip.tipid AND tiptext like '%001';
UPDATE coursetip, tip SET week = 2 WHERE coursetip.tipid = tip.tipid AND tiptext like '%002';
UPDATE coursetip, tip SET week = 3 WHERE coursetip.tipid = tip.tipid AND tiptext like '%003';
UPDATE coursetip, tip SET week = 4 WHERE coursetip.tipid = tip.tipid AND tiptext like '%004';

#--------------- tipstatus ------------------------------------------------
INSERT INTO usertipstatus (generaltipid, coursetipid, userid, tipstatusid)
  SELECT generaltipid, NULL AS coursetipid, user.userid, tipstatus.tipstatusid
  FROM generaltip_shared, user, tipstatus
  WHERE user.usershortname = 'ksanter'
  AND tiptext LIKE '%shared general announcement 001%'
  AND tipstatus.tipstatusname = 'completed';
  
INSERT INTO usertipstatus (generaltipid, coursetipid, userid, tipstatusid)
  SELECT generaltipid, NULL AS coursetipid, user.userid, tipstatus.tipstatusid
  FROM generaltip_shared, user, tipstatus
  WHERE user.usershortname = 'ksanter'
  AND tiptext LIKE '%shared general announcement 002%'
  AND tipstatus.tipstatusname = 'scheduled';  
  
INSERT INTO usertipstatus (generaltipid, coursetipid, userid, tipstatusid)
  SELECT generaltipid, NULL AS coursetipid, user.userid, tipstatus.tipstatusid
  FROM generaltip_shared, user, tipstatus
  WHERE user.usershortname = 'carlos'
  AND tiptext LIKE '%shared general announcement 002%'
  AND tipstatus.tipstatusname = 'completed';
  
INSERT INTO usertipstatus (generaltipid, coursetipid, userid, tipstatusid)
  SELECT generaltipid, NULL AS coursetipid, user.userid, tipstatus.tipstatusid
  FROM generaltip_personal, user, tipstatus
  WHERE user.usershortname = 'ksanter'
  AND tiptext LIKE '%ksanter general announcement 002%'
  AND tipstatus.tipstatusname = 'scheduled';  
  
INSERT INTO usertipstatus (generaltipid, coursetipid, userid, tipstatusid)
  SELECT generaltipid, NULL AS coursetipid, user.userid, tipstatus.tipstatusid
  FROM generaltip_personal, user, tipstatus
  WHERE user.usershortname = 'carlos'
  AND tiptext LIKE '%carlos general announcement 002%'
  AND tipstatus.tipstatusname = 'completed'; 

INSERT INTO usertipstatus (generaltipid, coursetipid, userid, tipstatusid)
  SELECT NULL AS generaltipid, coursetipid, user.userid, tipstatus.tipstatusid
  FROM coursetip_shared, user, tipstatus
  WHERE user.usershortname = 'ksanter'
  AND tiptext LIKE '%java a tip 001%'
  AND tipstatus.tipstatusname = 'completed';  
  
INSERT INTO usertipstatus (generaltipid, coursetipid, userid, tipstatusid)
  SELECT NULL AS generaltipid, coursetipid, user.userid, tipstatus.tipstatusid
  FROM coursetip_shared, user, tipstatus
  WHERE user.usershortname = 'ksanter'
  AND tiptext LIKE '%web design tip 002%'
  AND tipstatus.tipstatusname = 'scheduled'; 
  