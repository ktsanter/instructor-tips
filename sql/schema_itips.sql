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

create table tip
(
  tipid            int unsigned not null AUTO_INCREMENT,
  userid           int unsigned not null,
  tipcontent       varchar(2000),
  
  primary key (tipid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade,
  constraint unique(userid, tipcontent)
);

create table tag
(
  tagid            int unsigned not null AUTO_INCREMENT,
  userid           int unsigned not null,
  tagcontent       varchar(200),
  
  primary key (tagid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade,
  constraint unique(userid, tagcontent)
);

create table tip_tag
(
  tip_tagid        int unsigned not null AUTO_INCREMENT,
  tipid            int unsigned not null,
  tagid            int unsigned not null,
  
  primary key (tip_tagid),
  constraint foreign key (tipid) references tip (tipid) on delete cascade,
  constraint foreign key (tagid) references tag (tagid) on delete cascade,
  constraint unique(tipid, tagid)
);

create table schedule_tip
(
  schedule_tipid     int unsigned not null AUTO_INCREMENT,
  scheduleid         int unsigned not null,
  weekindex          int unsigned not null,
  tipid              int unsigned not null,
  tipstate           varchar(20),
  
  primary key (schedule_tipid),
  constraint foreign key (scheduleid) references schedule (scheduleid) on delete cascade,
  constraint foreign key (tipid) references tip (tipid) on delete cascade,
  constraint unique(scheduleid, weekindex, tipid)
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

DELIMITER //
create procedure add_tip(in user_Id int, in tip_Content varchar(2000))
begin
  insert into tip (
    userid, tipcontent
    
  ) values (
    user_Id, tip_Content
  );
  
  select LAST_INSERT_ID() as tipid;
end;
//
DELIMITER ;

