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

CREATE TABLE usercourse
(
  usercourseid           int unsigned NOT NULL AUTO_INCREMENT ,
  userid                 int unsigned NULL,
  courseid               int unsigned NULL,
  termgroupid            int unsigned NOT NULL,

  PRIMARY KEY (usercourseid),
  CONSTRAINT UNIQUE (userid, courseid, termgroupid),
  CONSTRAINT FOREIGN KEY (userid) REFERENCES user (userid) ON DELETE CASCADE,  
  CONSTRAINT FOREIGN KEY (courseid) REFERENCES course (courseid) ON DELETE CASCADE,
  CONSTRAINT FOREIGN KEY (termgroupid) REFERENCES termgroup (termgroupid) ON DELETE CASCADE
);

CREATE TABLE tip
(
  tipid     int unsigned NOT NULL AUTO_INCREMENT ,
  userid    int unsigned NULL ,
  tiptext   varchar(1000) NOT NULL ,

  PRIMARY KEY (tipid),
  CONSTRAINT FOREIGN KEY (userid) REFERENCES User (userid) ON DELETE CASCADE
);

CREATE TABLE mappedtip
(
  mappedtipid      int unsigned NOT NULL AUTO_INCREMENT,
  usercourseid     int unsigned NULL,
  tipid            int unsigned NOT NULL ,
  week             int unsigned NOT NULL ,
  
  PRIMARY KEY (mappedtipid),
  CONSTRAINT UNIQUE (usercourseid, tipid, week),
  CONSTRAINT FOREIGN KEY (usercourseid) REFERENCES usercourse (usercourseid) ON DELETE CASCADE,
  CONSTRAINT FOREIGN KEY (tipid) REFERENCES tip (tipid) ON DELETE CASCADE
);

/*---
CREATE TABLE tipstatus
(
  tipstatusid   int unsigned NOT NULL AUTO_INCREMENT ,
  tipstatusname varchar(30) NOT NULL ,

  PRIMARY KEY (tipstatusid),
  CONSTRAINT UNIQUE(tipstatusname)
);
---*/

CREATE TABLE usertipstatus
(
  usertipstatusid  int unsigned NOT NULL AUTO_INCREMENT ,
  mappedtipid      int unsigned NOT NULL ,
  userid           int unsigned NOT NULL,
  for_usercourseid int unsigned NOT NULL,
  tipstatusname    varchar(30) NOT NULL,

  PRIMARY KEY (usertipstatusid),
  CONSTRAINT UNIQUE (mappedtipid, userid, for_usercourseid),
  CONSTRAINT FOREIGN KEY (mappedtipid) REFERENCES mappedtip (mappedtipid) ON DELETE CASCADE,
  CONSTRAINT FOREIGN KEY (userid) REFERENCES user (userid) ON DELETE CASCADE,
  CONSTRAINT FOREIGN KEY (for_usercourseid) REFERENCES usercourse (usercourseid) ON DELETE CASCADE
);

#--------------------------------------------------------------------------
CREATE VIEW viewmappedtip AS
  select mappedtipid, user.userid, user.username, course.courseid, course.coursename, termgroup.termgroupid, termgroup.termgroupname, tip.tipid, tip.tiptext, mappedtip.week 
  from mappedtip, usercourse, termgroup, course, tip, user
  where mappedtip.usercourseid = usercourse.usercourseid
  and usercourse.termgroupid = termgroup.termgroupid 
  and mappedtip.tipid = tip.tipid
  and usercourse.userid = user.userid
  and usercourse.courseid = course.courseid

  UNION

  select mappedtipid, NULL AS userid, NULL AS username, course.courseid, course.coursename, termgroup.termgroupid, termgroup.termgroupname, tip.tipid, tip.tiptext, mappedtip.week 
  from mappedtip, usercourse, termgroup, course, tip
  where mappedtip.usercourseid = usercourse.usercourseid
  and usercourse.termgroupid = termgroup.termgroupid 
  and mappedtip.tipid = tip.tipid
  and usercourse.userid IS NULL
  and usercourse.courseid = course.courseid

  UNION

  select mappedtipid, user.userid, user.username, NULL AS courseid, NULL AS coursename, termgroup.termgroupid, termgroup.termgroupname, tip.tipid, tip.tiptext, mappedtip.week 
  from mappedtip, usercourse, termgroup, tip, user
  where mappedtip.usercourseid = usercourse.usercourseid
  and usercourse.termgroupid = termgroup.termgroupid 
  and mappedtip.tipid = tip.tipid
  and usercourse.userid = user.userid
  and usercourse.courseid IS NULL

  UNION

  select mappedtipid, NULL AS userid, NULL AS username, NULL AS courseid, NULL AS coursename, termgroup.termgroupid, termgroup.termgroupname, tip.tipid, tip.tiptext, mappedtip.week 
  from mappedtip, usercourse, termgroup, tip
  where mappedtip.usercourseid = usercourse.usercourseid
  and usercourse.termgroupid = termgroup.termgroupid 
  and mappedtip.tipid = tip.tipid
  and usercourse.userid IS NULL
  and usercourse.courseid IS NULL;
  
#--------------------------------------------------------------------------
CREATE VIEW viewusercourse as
  select usercourseid, NULL AS courseid, NULL AS coursename, NULL AS ap, termgroup.termgroupid, termgroupname, NULL AS userid, NULL AS username  
  from usercourse, termgroup  
  where usercourse.courseid IS NULL
    and usercourse.termgroupid = termgroup.termgroupid  
    and usercourse.userid IS NULL

  union
  select usercourseid, course.courseid, coursename, ap, termgroup.termgroupid, termgroupname, NULL AS userid, NULL AS username  
  from usercourse, course, termgroup
  where usercourse.courseid = course.courseid
    and usercourse.termgroupid = termgroup.termgroupid  
    and usercourse.userid IS NULL

  union
  select usercourseid, NULL AS courseid, NULL AS coursename, NULL AS ap, termgroup.termgroupid, termgroupname, user.userid, user.username  
  from usercourse, termgroup, user  
  where usercourse.courseid IS NULL
    and usercourse.termgroupid = termgroup.termgroupid  
    and usercourse.userid = user.userid

  union
  select usercourseid, course.courseid, coursename, ap, termgroup.termgroupid, termgroupname, user.userid, user.username  
  from usercourse, course, termgroup, user  
  where usercourse.courseid = course.courseid
    and usercourse.termgroupid = termgroup.termgroupid  
    and usercourse.userid = user.userid;
  

#--------------------------------------------------------------------------
create view viewusertipstatus as
select 
  v.mappedtipid, 
  v.userid as tip_userid, 
  v.username as tip_username, 
  v.courseid, v.coursename, 
  v.termgroupid, 
  v.termgroupname, 
  v.week, 
  v.tiptext, 
  uts.usertipstatusid, 
  uts.userid as tipstatus_userid, 
  uts.tipstatusname,
  uts.userid,
  uts.for_usercourseid  
from viewmappedtip as v
left outer join (
  select
    usertipstatusid, 
    mappedtipid, 
    userid, 
    tipstatusname,
    for_usercourseid
  from usertipstatus
) as uts on (
  v.mappedtipid = uts.mappedtipid
)
