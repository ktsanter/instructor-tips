#-----------------------------------------------------------------
#-- create DB for Pacing Guide viewer
#-----------------------------------------------------------------
select "creating pacing guide viewer db" as comment;

DROP DATABASE IF EXISTS pacingguide;
CREATE DATABASE pacingguide;
USE pacingguide;

#-----------------------------------------------------------------
#-- tables
#-----------------------------------------------------------------
select "creating tables" as comment;

create table courselisting
(
  courselistingid       int unsigned not null AUTO_INCREMENT,
  textkey               varchar(50) not null,
  description           varchar(200) not null,
  
  primary key (courselistingid),
  constraint unique(textkey)
);

create table startend
(
  startendid            int unsigned not null AUTO_INCREMENT,
  description           varchar(200) not null,
  startdate             varchar(20) not null,
  enddate               varchar(20) not null,
  
  primary key (startendid)
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
    