#-----------------------------------------------------------------
#-- create DB for TreasureHunt
#-----------------------------------------------------------------
select "creating treasurehunt db" as comment;

DROP DATABASE IF EXISTS treasurehunt;
CREATE DATABASE treasurehunt;
USE treasurehunt;

#-----------------------------------------------------------------
#-- tables
#-----------------------------------------------------------------
select "creating tables" as comment;

create table project
(
  projectid             int unsigned not null AUTO_INCREMENT,
  userid                int unsigned not null,
  projectname           varchar(200) not null,
  imagename             varchar(200) not null,
  imagefullpage         boolean not null,
  message               varchar(500) not null,
  positiveresponse      varchar(500) not null,
  negativeresponse      varchar(500) not null,
  
  primary key (projectid),
  constraint unique(userid, projectname),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade
);

create table clue
(
  clueid                int unsigned not null AUTO_INCREMENT,
  projectid             int unsigned not null,
  cluenumber            int unsigned not null,
  clueprompt            varchar(200) not null,
  clueresponse          varchar(200) not null,
  clueactiontype        varchar(30) not null,
  clueactiontarget      varchar(200) not null,
  clueactioneffecttype  varchar(30) not null,
  clueactionmessage     varchar(200) not null,
  cluesearchfor         varchar(200) not null,
  clueconfirmation      varchar(200) not null,
  
  primary key (clueid),
  constraint foreign key (projectid) references project (projectid) on delete cascade
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
    