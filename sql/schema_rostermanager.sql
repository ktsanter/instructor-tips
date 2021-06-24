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
create table rosterfile
(
  rosterfileid          int unsigned not null AUTO_INCREMENT,
  userid                int unsigned not null,
  googlefileid          varchar(200) not null,
  
  primary key (rosterfileid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade,
  constraint unique(userid, googlefileid)
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
    