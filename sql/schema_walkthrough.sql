#-----------------------------------------------------------------
#-- create walkthrough DB
#-----------------------------------------------------------------
select "creating walkthrough db" as comment;

DROP DATABASE IF EXISTS walkthrough;
CREATE DATABASE walkthrough;
USE walkthrough;

#-----------------------------------------------------------------
#-- tables
#-----------------------------------------------------------------
select "creating tables" as comment;

create table commentset
(
  commentsetid     int unsigned not null AUTO_INCREMENT,
  userid           int unsigned not null,
  hierarchy        varchar(20000) null,
  
  primary key (commentsetid),
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
create procedure add_default_commentset(in user_Id int)
begin
  insert into commentset (
    userid
  ) values (
    user_Id
  );
  
  select 
    LAST_INSERT_ID() as commentsetid,
    hierarchy
  from commentset;
end;

//
DELIMITER ;