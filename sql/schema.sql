DROP DATABASE IF EXISTS instructortips;
CREATE DATABASE instructortips;
USE instructortips;

CREATE TABLE user
(
  userid        int unsigned NOT NULL AUTO_INCREMENT ,
  usershortname varchar(30) NOT NULL ,
  username      varchar(100) NOT NULL ,

  PRIMARY KEY (userid),
  CONSTRAINT UNIQUE(usershortname)
);

CREATE TABLE privilege
(
  privilegeid   int unsigned NOT NULL AUTO_INCREMENT ,
  privilegename varchar(30) NOT NULL ,

  PRIMARY KEY (privilegeid),
  CONSTRAINT UNIQUE(privilegename)
);

CREATE TABLE userprivilege
(
  userprivilegeid int unsigned NOT NULL AUTO_INCREMENT ,
  userid          int unsigned NOT NULL ,
  privilegeid     int unsigned NOT NULL ,

  PRIMARY KEY (userprivilegeid),
  CONSTRAINT UNIQUE (userid),
  CONSTRAINT FOREIGN KEY (userid) REFERENCES User (userid) ON DELETE CASCADE,
  CONSTRAINT FOREIGN KEY (privilegeid) REFERENCES Privilege (privilegeid) ON DELETE CASCADE
);

CREATE TABLE usertipfilter
(
  usertipfilterid  int unsigned NOT NULL AUTO_INCREMENT,
  userid           int unsigned NOT NULL,
  tipfilter        varchar(1024) NOT NULL,
  tipfiltertype    varchar(30) NOT NULL,
  
  PRIMARY KEY (usertipfilterid),
  CONSTRAINT UNIQUE (userid, tipfiltertype),
  CONSTRAINT FOREIGN KEY (userid) REFERENCES user (userid) on DELETE CASCADE
);

CREATE TABLE termgroup
(
  termgroupid   int unsigned NOT NULL AUTO_INCREMENT,
  termgroupname varchar(30) NOT NULL,
  termlength    int unsigned NOT NULL,

  PRIMARY KEY (termgroupid),
  CONSTRAINT UNIQUE(termgroupname)  
);

CREATE TABLE term
(
  termid      int unsigned NOT NULL AUTO_INCREMENT ,
  termname    varchar(30) NOT NULL ,
  termgroupid int unsigned NOT NULL ,

  PRIMARY KEY (termid),
  CONSTRAINT UNIQUE(termname),
  CONSTRAINT FOREIGN KEY (termgroupid) REFERENCES termgroup (termgroupid) ON DELETE CASCADE
);

CREATE TABLE course
(
  courseid        int unsigned NOT NULL AUTO_INCREMENT ,
  coursename      varchar(100) NOT NULL ,
  ap              boolean NOT NULL ,

  PRIMARY KEY (courseid),
  CONSTRAINT UNIQUE(coursename)
);

CREATE TABLE courseterm
(
  coursetermid           int unsigned NOT NULL AUTO_INCREMENT ,
  courseid               int unsigned NOT NULL ,
  termgroupid            int unsigned NOT NULL ,

  PRIMARY KEY (coursetermid),
  CONSTRAINT UNIQUE (courseid, termgroupid),
  CONSTRAINT FOREIGN KEY (courseid) REFERENCES Course (courseid) ON DELETE CASCADE,
  CONSTRAINT FOREIGN KEY (termgroupid) REFERENCES termgroup (termgroupid) ON DELETE CASCADE
);

DELIMITER //

CREATE TRIGGER load_course_terms
AFTER INSERT ON course
FOR EACH ROW
BEGIN
  IF NEW.ap = 0 THEN
    INSERT INTO courseterm(courseid, termgroupid) 
      SELECT NEW.courseid, termgroupid FROM termgroup;
  END IF;
END; //

DELIMITER ;

CREATE TABLE tip
(
  tipid     int unsigned NOT NULL AUTO_INCREMENT ,
  userid    int unsigned NULL ,
  tiptext   varchar(1000) NOT NULL ,

  PRIMARY KEY (tipid),
  CONSTRAINT FOREIGN KEY (userid) REFERENCES User (userid) ON DELETE CASCADE
);

CREATE TABLE generaltip
(
  generaltipid     int unsigned NOT NULL AUTO_INCREMENT ,
  tipid            int unsigned NOT NULL ,
  termgroupid      int unsigned NOT NULL ,
  week             int unsigned NOT NULL ,

  PRIMARY KEY (generaltipid),
  CONSTRAINT FOREIGN KEY (tipid) REFERENCES Tip (tipid) ON DELETE CASCADE,
  CONSTRAINT FOREIGN KEY (termgroupid) REFERENCES termgroup (termgroupid) ON DELETE CASCADE
);

CREATE TABLE coursetip
(
  coursetipid            int unsigned NOT NULL AUTO_INCREMENT ,
  tipid                  int unsigned NOT NULL ,
  week                   int NOT NULL ,
  coursetermid           int unsigned NOT NULL ,

  PRIMARY KEY (coursetipid),
  CONSTRAINT FOREIGN KEY (tipid) REFERENCES Tip (tipid) ON DELETE CASCADE,
  CONSTRAINT FOREIGN KEY (coursetermid) REFERENCES CourseTerm (coursetermid) ON DELETE CASCADE
);

CREATE TABLE tipstatus
(
  tipstatusid   int unsigned NOT NULL AUTO_INCREMENT ,
  tipstatusname varchar(30) NOT NULL ,

  PRIMARY KEY (tipstatusid),
  CONSTRAINT UNIQUE(tipstatusname)
);

CREATE TABLE usertipstatus
(
  usertipstatusid int unsigned NOT NULL AUTO_INCREMENT ,
  generaltipid    int unsigned NULL ,
  coursetipid     int unsigned NULL ,
  userid          int unsigned NOT NULL ,
  tipstatusid     int unsigned NOT NULL ,

  PRIMARY KEY (usertipstatusid),
  CONSTRAINT FOREIGN KEY (generaltipid) REFERENCES GeneralTip (generaltipid) ON DELETE CASCADE,
  CONSTRAINT FOREIGN KEY (coursetipid) REFERENCES CourseTip (coursetipid) ON DELETE CASCADE,
  CONSTRAINT FOREIGN KEY (userid) REFERENCES User (userid) ON DELETE CASCADE,
  CONSTRAINT FOREIGN KEY (tipstatusid) REFERENCES TipStatus (tipstatusid) ON DELETE CASCADE
);

CREATE VIEW generaltip_shared AS
SELECT tiptext, week, termgroup.termgroupname, NULL AS userid, NULL AS username, NULL AS usershortname, generaltipid, generaltip.tipid, termgroup.termgroupid, termgroup.termlength
FROM generaltip, tip, termgroup
WHERE generaltip.tipid = tip.tipid
AND tip.userid IS NULL
AND termgroup.termgroupid = generaltip.termgroupid;

CREATE VIEW generaltip_personal AS
SELECT tiptext, week, termgroup.termgroupname, user.userid, user.username, user.usershortname, generaltipid, generaltip.tipid, termgroup.termgroupid, termgroup.termlength
FROM generaltip, tip, termgroup, user
WHERE generaltip.tipid = tip.tipid
AND tip.userid IS NOT NULL
AND tip.userid = user.userid
AND termgroup.termgroupid = generaltip.termgroupid;

CREATE VIEW coursetip_shared AS
SELECT tiptext, week, termgroup.termgroupname, NULL AS userid, NULL AS username, NULL AS usershortname, coursetipid, coursetip.tipid, termgroup.termgroupid, termgroup.termlength, course.courseid, course.coursename
FROM coursetip, tip, courseterm, termgroup, course
WHERE coursetip.tipid = tip.tipid
AND coursetip.coursetermid = courseterm.coursetermid
AND courseterm.termgroupid = termgroup.termgroupid
and courseterm.courseid = course.courseid
AND tip.userid IS NULL;

CREATE VIEW coursetip_personal AS
SELECT tiptext, week, termgroup.termgroupname, user.userid, user.username, user.usershortname, coursetipid, coursetip.tipid, termgroup.termgroupid, termgroup.termlength, course.courseid, course.coursename
FROM coursetip, tip, courseterm, termgroup, course, user
WHERE coursetip.tipid = tip.tipid
AND coursetip.coursetermid = courseterm.coursetermid
AND courseterm.termgroupid = termgroup.termgroupid
AND courseterm.courseid = course.courseid
AND tip.userid IS NOT NULL
AND user.userid = tip.userid;

CREATE VIEW mappedtips AS
SELECT 
  tipid, tiptext, 
  termgroupid, termgroupname, termlength, week, 
  userid, username, 
  NULL AS generaltipid, coursetipid,
  courseid, coursename
FROM coursetip_shared
UNION
SELECT 
  tipid, tiptext, 
  termgroupid, termgroupname, termlength, week, 
  userid, username, 
  NULL AS generaltipid, coursetipid,
  courseid, coursename
from coursetip_personal
UNION
SELECT 
  tipid, tiptext, 
  termgroupid, termgroupname, termlength, week, 
  userid, username, 
  generaltipid, NULL AS coursetipid,
  NULL AS courseid, NULL AS coursename
FROM generaltip_shared
UNION
SELECT 
  tipid, tiptext, 
  termgroupid, termgroupname, termlength, week, 
  userid, username, 
  generaltipid, NULL AS coursetipid,
  NULL AS courseid, NULL AS coursename
FROM generaltip_personal;

CREATE VIEW alltipmapping as
SELECT
  tip.tipid, tiptext, 
  a.termgroupname, a.termlength, a.week,
  a.username,
  a.generaltipid, a.coursetipid,
  a.coursename  
FROM tip
LEFT OUTER JOIN (
  SELECT
    tipid,  
    termgroupname, termlength, week,
    username,
    generaltipid, coursetipid,
    coursename  
  FROM mappedtips
) AS a
ON tip.tipid = a.tipid;