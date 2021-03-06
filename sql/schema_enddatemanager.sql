#-----------------------------------------------------------------
#-- create End date manager
#-----------------------------------------------------------------
select "creating enddatemanager db" as comment;

DROP DATABASE IF EXISTS enddatemanager;
CREATE DATABASE enddatemanager;
USE enddatemanager;

#-----------------------------------------------------------------
#-- tables
#-----------------------------------------------------------------
select "creating tables" as comment;

create table configuration
(
  configurationid          int unsigned not null AUTO_INCREMENT,
  userid                   int unsigned not null,
  calendarid               varchar(300) null,
  emailnotification        int unsigned not null,
  emailnotificationminutes int unsigned not null,
  popupnotification        int unsigned not null,
  popupnotificationminutes int unsigned not null,
  
  primary key (configurationid),
  constraint unique(userid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade
);

create table eventoverride
(
  eventoverrideid        int unsigned not null AUTO_INCREMENT,
  configurationid        int unsigned not null,
  student                varchar(200) not null,
  section                varchar(500) not null,
  enddate                varchar(20) not null,
  enrollmentenddate      varchar(20) not null,
  notes                  varchar(1000) not null,
  
  primary key (eventoverrideid),
  constraint unique(configurationid, student, section),
  constraint foreign key (configurationid) references configuration (configurationid) on delete cascade
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
create procedure add_default_configuration(in user_Id int)
begin
  insert into configuration (
    userid,
    calendarid,
    emailnotification,
    emailnotificationminutes,
    popupnotification,
    popupnotificationminutes
  ) values (
    user_Id,
    null,
    1,
    360,
    1,
    720
  );
  
  select 
    LAST_INSERT_ID() as configurationid,
    calendarid,
    emailnotification,
    emailnotificationminutes,
    popupnotification,
    popupnotificationminutes
  from configuration
  where userid = user_Id;
end;
//
DELIMITER ;
