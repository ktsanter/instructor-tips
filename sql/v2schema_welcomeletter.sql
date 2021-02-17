#-----------------------------------------------------------------
#-- create DB for welcome letter configuration (version 2)
#-----------------------------------------------------------------
select "creating welcome letter configuration db (v2)" as comment;

DROP DATABASE IF EXISTS welcomeletterv2;
CREATE DATABASE welcomeletterv2;
USE welcomeletterv2;

#-----------------------------------------------------------------
#-- tables
#-----------------------------------------------------------------
select "creating tables" as comment;

#----------------------------------------------------------------------
create table course
(
  courseid              int unsigned not null AUTO_INCREMENT,
  userid                int unsigned not null,
  coursename            varchar(200) not null,
  ap                    boolean not null,
  haspasswords          boolean not null,
  
  primary key (courseid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade,
  constraint unique(userid, coursename)
);

#----------------------------------------------------------------------
create table exam
(
  examid                int unsigned not null AUTO_INCREMENT,
  examdescription       varchar(500) not null,
  
  primary key (examid),
  constraint unique(examdescription)
);

create table proctoring
(
  proctoringid          int unsigned not null AUTO_INCREMENT,
  proctoringdescription varchar(500) not null,
  
  primary key (proctoringid),
  constraint unique(proctoringdescription)
);

create table retake
(
  retakeid              int unsigned not null AUTO_INCREMENT,
  retakedescription     varchar(500) not null,
  
  primary key (retakeid),
  constraint unique(retakedescription)
);

create table resubmission
(
  resubmissionid              int unsigned not null AUTO_INCREMENT,
  resubmissiondescription     varchar(500) not null,
  
  primary key (resubmissionid),
  constraint unique(resubmissiondescription)
);

#----------------------------------------------------------------------
create table configuration
(
  configurationid             int unsigned not null AUTO_INCREMENT,
  courseid                    int unsigned not null,
  examid                      int unsigned null,
  proctoringid                int unsigned null,
  retakeid                    int unsigned null,
  resubmissionid              int unsigned null,
  
  primary key (configurationid),
  constraint unique(courseid),
  constraint foreign key (courseid) references course (courseid) on delete cascade,
  constraint foreign key (examid) references exam (examid) on delete cascade,
  constraint foreign key (proctoringid) references proctoring (proctoringid) on delete cascade,
  constraint foreign key (retakeid) references retake (retakeid) on delete cascade,
  constraint foreign key (resubmissionid) references resubmission (resubmissionid) on delete cascade  
);

#----------------------------------------------------------------------

create table generalkeypoint
(
  generalkeypointid           int unsigned not null AUTO_INCREMENT,
  keypoint                    varchar(500) not null,
  ap                          boolean not null,
  student                     boolean not null,
  mentor                      boolean not null,

  primary key (generalkeypointid),
  constraint unique(keypoint)
);

#--------------------------------------------------------------------------
#-- triggers
#--------------------------------------------------------------------------
select "creating triggers" as comment;
    
CREATE TRIGGER trigger_newcourse
  AFTER INSERT ON course FOR EACH ROW
    INSERT configuration (courseid, examid, proctoringid, retakeid, resubmissionid)
    SELECT new.courseid, NULL, NULL, NULL, NULL;
    
#--------------------------------------------------------------------------
#-- views
#--------------------------------------------------------------------------
select "creating views" as comment;
    
#--------------------------------------------------------------------------
#-- stored procedures
#--------------------------------------------------------------------------
select "creating stored procedures" as comment;

DELIMITER //
create procedure add_default_course(in user_Id int, in course_name varchar(200))
begin
  insert into course(
    userid, 
    coursename,
    ap,
    haspasswords
  ) values (
    user_Id,
    course_name,
    false,
    true
  );
  
  select LAST_INSERT_ID() as courseid;
end;
//
DELIMITER ;
    