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

create table shared_schedule
(
  shared_scheduleid     int unsigned not null AUTO_INCREMENT,
  userid                int unsigned not null,
  sharedon              varchar(30) not null,
  schedulename          varchar(200), 
  schedulelength        int unsigned not null,
  schedulestart         varchar(15),  
  sharedby              varchar(200) not null,
  sharecomment          varchar(2000) not null,
  
  primary key (shared_scheduleid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade
);

create table shared_schedule_tip
(
  shared_scheduletipid  int unsigned not null AUTO_INCREMENT,
  shared_scheduleid     int unsigned not null,
  weekindex             int unsigned not null,
  tipcontent            varchar(2000),
  
  primary key (shared_scheduletipid),
  constraint foreign key (shared_scheduleid) references shared_schedule (shared_scheduleid) on delete cascade
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

DELIMITER //
create procedure add_shared_schedule(in schedule_Id int, in shareby_Id int, in sharewith_Id int, in share_Comment varchar(2000))
begin
  insert into shared_schedule (
    userid, sharedon, schedulename, schedulelength, schedulestart, sharedby, sharecomment
  ) select
    sharewith_Id,
    now(),
    a.schedulename,
    a.schedulelength,
    a.schedulestart,    
    b.username,
    share_Comment
  from 
    schedule as a, 
    instructortips.user as b
  where a.scheduleid = schedule_Id
    and b.userid = shareby_Id;
  
  set @shared_schedule_id = LAST_INSERT_ID();
  
  insert into shared_schedule_tip (
    shared_scheduleid,
    weekindex,
    tipcontent
  ) select
    @shared_schedule_id,
    a.weekindex,
    b.tipcontent
  from 
    schedule_tip as a,
    tip as b
  where a.scheduleid = schedule_Id
    and a.tipid = b.tipid;

end;
//
DELIMITER ;
