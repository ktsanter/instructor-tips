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
  message               mediumtext not null,
  positiveresponse      mediumtext not null,
  negativeresponse      mediumtext not null,
  
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

create table projectpreview
(
  userid                int unsigned not null,
  snapshot              JSON,
  
  primary key (userid),
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

DELIMITER //
create procedure add_project(in user_Id int, in project_Name varchar(200))
begin
  insert into project(
    userid, 
    projectname, imagename, imagefullpage,
    message,
    positiveresponse, negativeresponse
  ) values (
    user_Id,
    project_Name, 
    '', 0,
    '',
    '', ''
  );
  
  select LAST_INSERT_ID() as projectid;
end;
//
DELIMITER ;

DELIMITER //
create procedure add_default_clue(in project_Id int)
begin
  select max(cluenumber)+1 into @maxcluenumber from clue where projectid = project_Id;
  if @maxcluenumber is null then select 1 into @maxcluenumber; end if;
  
  insert into clue(
    projectid,
    cluenumber,
    clueprompt, 
    clueresponse,
    clueactiontype,
    clueactiontarget,
    clueactioneffecttype,
    clueactionmessage,
    cluesearchfor,
    clueconfirmation
  ) values (
    project_Id,
    @maxcluenumber,
    'default prompt', 'default response',
    'none',
    '',
    '',
    '',
    '',
    'default confirmation'
  );
  
  select LAST_INSERT_ID() as clueid;
end;
//
DELIMITER ;
