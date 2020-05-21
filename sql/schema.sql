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
  sharedschedule    int unsigned NOT NULL ,
  pushreminders     int unsigned NOT NULL,

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

  PRIMARY KEY (tipid),
  CONSTRAINT UNIQUE (tiptext)
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

  PRIMARY KEY (scheduletipid),
  CONSTRAINT UNIQUE (scheduleid, tipid),
  CONSTRAINT FOREIGN KEY (scheduleid) REFERENCES schedule (scheduleid) ON DELETE CASCADE,
  CONSTRAINT FOREIGN KEY (tipid) REFERENCES tip (tipid) ON DELETE CASCADE
);

#--------------------------------------------------------------------------
#-- triggers
#--------------------------------------------------------------------------
select "creating triggers" as comment;
    
#--------------------------------------------------------------------------
#-- views
#--------------------------------------------------------------------------
select "creating views" as comment;
