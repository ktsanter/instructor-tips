#-----------------------------------------------------------------
#-- create DB for Roster Manager
#-----------------------------------------------------------------
select "creating roster manager db" as comment;

DROP DATABASE IF EXISTS rostermanager;
CREATE DATABASE rostermanager;
USE rostermanager;

#-----------------------------------------------------------------
#-- tables
#-----------------------------------------------------------------
select "creating tables" as comment;

#----------------------------------------------------------------------
create table enrollment
(
  enrollmentid     int unsigned not null AUTO_INCREMENT,
  userid           int unsigned not null,
  student          varchar(200) not null,
  term             varchar(200) not null,
  section          varchar(200) not null,
  startdate        varchar(30) not null,
  enddate          varchar(30) not null,
  email            varchar(200) not null,
  affiliation      varchar(200) not null,
  
  primary key (enrollmentid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade
);

create or replace table mentor
(
  mentorid         int unsigned not null AUTO_INCREMENT,
  userid           int unsigned not null,
  student          varchar(200) not null,
  term             varchar(200) not null,
  section          varchar(200) not null,
  name             varchar(200) not null,
  email            varchar(200) not null,
  phone            varchar(200) not null,
  affiliation      varchar(200) not null,
  affiliationphone varchar(200) not null,
  
  primary key (mentorid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade
);

create or replace table mentorextra
(
  mentorextraid          int unsigned not null AUTO_INCREMENT,
  userid                 int unsigned not null,
  term                   varchar(200) not null,
  section                varchar(200) not null,
  name                   varchar(200) not null,
  welcomelettersent      int unsigned not null,
  
  primary key (mentorextraid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade
);

create or replace table guardian
(
  guardianid       int unsigned not null AUTO_INCREMENT,
  userid           int unsigned not null,
  student          varchar(200) not null,
  term             varchar(200) not null,
  section          varchar(200) not null,
  name             varchar(200) not null,
  email            varchar(200) not null,
  phone            varchar(200) not null,
  affiliation      varchar(200) not null,
  affiliationphone varchar(200) not null,
  
  primary key (guardianid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade
);

create or replace table iep
(
  iepid       int unsigned not null AUTO_INCREMENT,
  userid           int unsigned not null,
  student          varchar(200) not null,
  term             varchar(200) not null,
  section          varchar(200) not null,
  
  primary key (iepid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade
);

create or replace table student504
(
  student504id     int unsigned not null AUTO_INCREMENT,
  userid           int unsigned not null,
  student          varchar(200) not null,
  term             varchar(200) not null,
  section          varchar(200) not null,
  
  primary key (student504id),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade
);

create or replace table homeschooled
(
  homeschooledid       int unsigned not null AUTO_INCREMENT,
  userid           int unsigned not null,
  student          varchar(200) not null,
  term             varchar(200) not null,
  section          varchar(200) not null,
  
  primary key (homeschooledid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade
);

create table preferredname
(
  preferrednameid      int unsigned not null AUTO_INCREMENT,
  userid               int unsigned not null,
  studentname          varchar(200) not null,
  preferredname        varchar(200) not null,
  
  primary key (preferrednameid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade,
  constraint unique(userid, studentname)
);

create table pronouns
(
  pronounid            int unsigned not null AUTO_INCREMENT,
  userid               int unsigned not null,
  studentname          varchar(200) not null,
  pronouns             varchar(200) not null,
  
  primary key (pronounid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade,
  constraint unique(userid, studentname)
);

create table note
(
  noteid               int unsigned not null AUTO_INCREMENT,
  userid               int unsigned not null,
  studentname          varchar(200) not null,
  datestamp            varchar(10) not null,
  notetext             varchar(2000) not null,
  
  primary key (noteid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade
);

create table accesskey
(
  accesskeyid    int unsigned not null AUTO_INCREMENT,
  userid         int unsigned not null,
  accesskey      varchar(200) not null,
  
  primary key (accesskeyid),
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
    