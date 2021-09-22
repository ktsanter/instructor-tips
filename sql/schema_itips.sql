#-----------------------------------------------------------------
#-- create DB for ITips
#-----------------------------------------------------------------
select "creating itips db" as comment;

DROP DATABASE IF EXISTS itips;
CREATE DATABASE itips;
USE itips;

#-----------------------------------------------------------------
#-- tables
#-----------------------------------------------------------------
select "creating tables" as comment;

#----------------------------------------------------------------------
create table schedule
(
  scheduleid       int unsigned not null AUTO_INCREMENT,
  userid           int unsigned not null,
  schedulename     varchar(200),
  schedulelength   int unsigned not null,
  schedulestart    varchar(15),
  
  primary key (scheduleid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade,
  constraint unique(userid, schedulename)
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
create procedure add_schedule(in user_Id int, in schedule_Name varchar(200), schedule_Length int, schedule_Start varchar(15))
begin
  insert into schedule (
    userid, schedulename, schedulelength, schedulestart
    
  ) values (
    user_Id, schedule_Name, schedule_Length, schedule_Start
  );
  
  select LAST_INSERT_ID() as scheduleid;
end;
//
DELIMITER ;
