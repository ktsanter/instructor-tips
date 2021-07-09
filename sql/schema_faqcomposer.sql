#-----------------------------------------------------------------
#-- create FAQ composer
#-----------------------------------------------------------------
select "creating faqcomposer db" as comment;

DROP DATABASE IF EXISTS faqcomposer;
CREATE DATABASE faqcomposer;
USE faqcomposer;

#-----------------------------------------------------------------
#-- tables
#-----------------------------------------------------------------
select "creating tables" as comment;

create table project
(
  projectid             int unsigned not null AUTO_INCREMENT,
  userid                int unsigned not null,
  hierarchy             mediumtext null,
  
  primary key (projectid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade
);

create table faqset
(
  faqsetid             int unsigned not null AUTO_INCREMENT,
  projectid            int unsigned not null,
  faqsetname           varchar(200) not null,
  faqsetdata           mediumtext null,
  
  primary key (faqsetid),
  constraint foreign key (projectid) references project (projectid) on delete cascade,
  constraint unique(projectid, faqsetname)
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
create procedure add_default_project(in user_Id int)
begin
  insert into project (
    userid
  ) values (
    user_Id
  );
  
  select 
    LAST_INSERT_ID() as projectid,
    hierarchy
  from project;
end;

create procedure add_default_faqset(in project_Id int, in faqset_Name varchar(200))
begin
  insert into faqset (
    projectid,
    faqsetname
    
  ) values (
    project_Id,
    faqset_Name
  );
  
  select 
    LAST_INSERT_ID() as faqsetid
  from faqset;
end;

//
DELIMITER ;