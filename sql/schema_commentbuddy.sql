#-----------------------------------------------------------------
#-- create CommentBuddy DB
#-----------------------------------------------------------------
select "creating commentbuddy db" as comment;

DROP DATABASE IF EXISTS commentbuddy;
CREATE DATABASE commentbuddy;
USE commentbuddy;

#-----------------------------------------------------------------
#-- tables
#-----------------------------------------------------------------
select "creating tables" as comment;

create table comment
(
  commentid     int unsigned not null AUTO_INCREMENT,
  userid        int unsigned not null,
  tags          varchar(200) not null,
  hovertext     varchar(300) not null,
  commenttext   varchar(4000) not null,
  
  primary key (commentid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade
);

create table accesskey
(
  accesskeyid    int unsigned not null AUTO_INCREMENT,
  userid         int unsigned not null,
  accesskey      varchar(200) not null,
  
  primary key (accesskeyid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade,
  constraint unique(userid)
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
create procedure add_default_comment(in user_Id int)
begin
  insert into comment (
    userid,
    tags,
    hovertext,
    commenttext
  ) values (
    user_Id,
    "",
    "",
    "new comment"
  );
  
  select 
    LAST_INSERT_ID() as commentid
  from comment;
end;

create procedure add_comment(in user_Id int, in comment_Text varchar(4000))
begin
  insert into comment (
    userid,
    tags,
    hovertext,
    commenttext
  ) values (
    user_Id,
    "",
    "",
    comment_Text
  );
  
  select 
    LAST_INSERT_ID() as commentid
  from comment;
end;
//
DELIMITER ;