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
  hierarchy             varchar(20000) null,
  
  primary key (projectid),
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
//
DELIMITER ;