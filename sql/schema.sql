#-----------------------------------------------------------------
#-- create DB for Instructor Tips
#-----------------------------------------------------------------
select "creating instructortips db" as comment;

DROP DATABASE IF EXISTS instructortips;
CREATE DATABASE instructortips;
USE instructortips;

#-----------------------------------------------------------------
#-- tables
#-----------------------------------------------------------------
select "creating tables" as comment;

CREATE TABLE user
(
  userid            int unsigned NOT NULL AUTO_INCREMENT ,
  usershortname     varchar(30) NOT NULL ,
  username          varchar(100) NOT NULL ,
  email             varchar(100) NULL,
  password          varchar(20) NULL,

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

CREATE TABLE tip
(
  tipid     int unsigned NOT NULL AUTO_INCREMENT ,
  tiptext   varchar(1000) NOT NULL ,
  common   boolean NOT NULL ,
  userid    int unsigned NULL,

  PRIMARY KEY (tipid),
  CONSTRAINT UNIQUE (tiptext, userid)
);

CREATE TABLE category
(
  categoryid        int unsigned NOT NULL AUTO_INCREMENT ,
  categorytext      varchar(100) NOT NULL ,


  PRIMARY KEY (categoryid),
  CONSTRAINT UNIQUE (categorytext)
);

CREATE TABLE tipcategory
(
  tipcategoryid  int unsigned NOT NULL AUTO_INCREMENT ,
  tipid         int unsigned NULL ,
  categoryid     int unsigned NULL ,

  PRIMARY KEY (tipcategoryid),
  CONSTRAINT UNIQUE (tipid, categoryid),
  CONSTRAINT FOREIGN KEY (tipid) REFERENCES tip (tipid) ON DELETE CASCADE,
  CONSTRAINT FOREIGN KEY (categoryid) REFERENCES category (categoryid) ON DELETE CASCADE
);

CREATE TABLE schedule
(
  scheduleid  int unsigned NOT NULL AUTO_INCREMENT ,
  userid      int unsigned NOT NULL ,
  schedulename     varchar(1000) NOT NULL ,
  schedulelength    int unsigned NOT NULL ,
  schedulestartdate    varchar(50) NOT NULL ,

  PRIMARY KEY (scheduleid),
  CONSTRAINT UNIQUE (userid, schedulename),
  CONSTRAINT FOREIGN KEY (userid) REFERENCES user (userid) ON DELETE CASCADE
);

CREATE TABLE scheduletip
(
  scheduletipid  int unsigned NOT NULL AUTO_INCREMENT ,
  scheduleid      int unsigned NOT NULL ,
  tipid      int unsigned NOT NULL ,
  tipstate     int unsigned NOT NULL ,
  schedulelocation     int unsigned NOT NULL ,
  schedulelocationorder int unsigned NOT NULL,

  PRIMARY KEY (scheduletipid),
  CONSTRAINT UNIQUE (scheduleid, tipid, schedulelocation),
  CONSTRAINT FOREIGN KEY (scheduleid) REFERENCES schedule (scheduleid) ON DELETE CASCADE,
  CONSTRAINT FOREIGN KEY (tipid) REFERENCES tip (tipid) ON DELETE CASCADE
);

CREATE TABLE controlstate
(
  controlstateid  int unsigned NOT NULL AUTO_INCREMENT ,
  userid      int unsigned NOT NULL ,
  controlgroup varchar(50) NOT NULL,
  state     varchar(1000) NOT NULL,

  PRIMARY KEY (controlstateid),
  CONSTRAINT UNIQUE (userid, controlgroup),
  CONSTRAINT FOREIGN KEY (userid) REFERENCES user (userid) ON DELETE CASCADE
);

CREATE TABLE shareschedule
(
  sharescheduleid  int unsigned NOT NULL AUTO_INCREMENT ,
  scheduleid int unsigned NOT NULL, 
  userid_from      int unsigned NOT NULL ,
  userid_to      int unsigned NOT NULL ,
  comment     varchar(300) NOT NULL,
  datestamp   varchar(30) NOT NULL,

  PRIMARY KEY (sharescheduleid) ,

  CONSTRAINT UNIQUE (scheduleid, userid_from, userid_to, datestamp) ,
  CONSTRAINT FOREIGN KEY (scheduleid) REFERENCES schedule (scheduleid) ON DELETE CASCADE,
  CONSTRAINT FOREIGN KEY (userid_from) REFERENCES user (userid) ON DELETE CASCADE,
  CONSTRAINT FOREIGN KEY (userid_to) REFERENCES user (userid) ON DELETE CASCADE
);

CREATE TABLE sharescheduletip
(
  sharescheduletipid  int unsigned NOT NULL AUTO_INCREMENT ,
  sharescheduleid      int unsigned NOT NULL ,
  scheduletipid    int unsigned NOT NULL,
  tipid      int unsigned NOT NULL ,
  tipstate     int unsigned NOT NULL ,
  schedulelocation     int unsigned NOT NULL ,
  schedulelocationorder int unsigned NOT NULL,

  PRIMARY KEY (sharescheduletipid),
  CONSTRAINT UNIQUE (sharescheduleid, tipid, schedulelocation),
  CONSTRAINT FOREIGN KEY (sharescheduleid) REFERENCES shareschedule (sharescheduleid) ON DELETE CASCADE,
  CONSTRAINT FOREIGN KEY (tipid) REFERENCES tip (tipid) ON DELETE CASCADE
);

CREATE TABLE sharenotification
(
  sharenotificationid  int unsigned NOT NULL AUTO_INCREMENT ,
  userid      int unsigned NOT NULL ,
  notificationon     int unsigned NOT NULL ,


  PRIMARY KEY (sharenotificationid),
  CONSTRAINT UNIQUE (userid, notificationon),
  CONSTRAINT FOREIGN KEY (userid) REFERENCES user (userid) ON DELETE CASCADE
);

CREATE TABLE schedulenotification
(
  schedulenotificationid  int unsigned NOT NULL AUTO_INCREMENT ,
  userid      int unsigned NOT NULL ,
  scheduleid      int unsigned NOT NULL ,
  notificationtype  varchar(30) NOT NULL ,


  PRIMARY KEY (schedulenotificationid),
  CONSTRAINT UNIQUE (userid, scheduleid, notificationtype),
  CONSTRAINT FOREIGN KEY (userid) REFERENCES user (userid) ON DELETE CASCADE,
  CONSTRAINT FOREIGN KEY (scheduleid) REFERENCES schedule (scheduleid) ON DELETE CASCADE
);

#--------------------------------------------------------------------------
#-- triggers
#--------------------------------------------------------------------------
select "creating triggers" as comment;
    
#-- add default scheduling control state for new users
CREATE TRIGGER trigger_newuser_controlstate1
  AFTER INSERT ON user FOR EACH ROW
    INSERT controlstate (userid, controlgroup, state)
    SELECT new.userid, 'scheduling' AS courseid, '{"scheduleid": null, "showbrowse": false}' as state;
    
#-- add default tip browse filter control state for new users
CREATE TRIGGER trigger_newuser_controlstate2
  AFTER INSERT ON user FOR EACH ROW
    INSERT controlstate (userid, controlgroup, state)
    SELECT new.userid, 'filtering' AS courseid, '{"search": "", "keywords": [], "common": true, "allowcommonedit": false}' as state;
    
#-- add share notification default tfor new users
CREATE TRIGGER trigger_newuser_notification
  AFTER INSERT ON user FOR EACH ROW
    INSERT sharenotification (userid, notificationon)
    SELECT new.userid, 0 as notificationon;
    
#--------------------------------------------------------------------------
#-- views
#--------------------------------------------------------------------------
select "creating views" as comment;

#-- combine tip and category info
create view view_tipsandcategories as
  select t.tipid, t.userid, t.tiptext, t.common, jtc.categoryid, jtc.categorytext
  from tip as t 
  left outer join (
    select tc.tipid, tc.categoryid, c.categorytext
    from tipcategory as tc, category as c
    where tc.categoryid = c.categoryid
  ) as jtc on (
    t.tipid = jtc.tipid
  );

#-- get tips used on schedules by user (this includes shared)
create view view_tipsusedinschedule as
  select st.tipid, s.userid 
  from schedule as s, scheduletip as st
  where s.scheduleid = st.scheduleid;
  
#-- get count of schedules and shared schedules where a tip is used
create view view_tipusage as
  select vs.tipid, vs.schedulecount, jst.shareschedulecount
  from (
    select tipid, count(scheduleid) as schedulecount
    from scheduletip
    group by tipid
  )  as vs
  left outer join (
    select tipid, count(sharescheduleid) as shareschedulecount
    from sharescheduletip
    group by tipid
  ) as jst on (
    vs.tipid = jst.tipid
  )

  union all

  select jst.tipid, vs.schedulecount, jst.shareschedulecount
  from (
    select tipid, count(scheduleid) as schedulecount
    from scheduletip
    group by tipid
  )  as vs
  right outer join (
    select tipid, count(sharescheduleid) as shareschedulecount
    from sharescheduletip
    group by tipid
  ) as jst on (
    vs.tipid = jst.tipid
  ) where vs.schedulecount is null;