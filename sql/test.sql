drop procedure if exists add_shared_schedule;
drop table if exists shared_schedule_tip;
drop table if exists shared_schedule;

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
