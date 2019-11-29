#------------------------------------------------------------
#-- initial admin data load
#------------------------------------------------------------
#--- NOTE: the order matters here because of the course 
#---       and user triggers
#------------------------------------------------------------

select "loading admin data..." as comment;

USE instructortips;

select "deleting from tables" as comment;

DELETE FROM usertipfilter;
DELETE FROM userprivilege;
DELETE FROM privilege;
DELETE FROM user;
DELETE FROM usercourse;
DELETE FROM course;
DELETE FROM term;
DELETE FROM termgroup;
DELETE FROM tip;
DELETE FROM mappedtip;
DELETE from usertipstatus;

#-------------------------------------------------------------
#-- termgroup
#-------------------------------------------------------------
select "loading termgroup" as comment;

load data local infile 'initial_load_data/termgroup.txt'
into table termgroup
FIELDS TERMINATED BY '|'
LINES TERMINATED BY '\r\n'
(termgroupname, termlength);

#-------------------------------------------------------------
#-- privilege
#-------------------------------------------------------------
select "loading privilege" as comment;

load data local infile 'initial_load_data/privilege.txt'
into table privilege
FIELDS TERMINATED BY '|'
LINES TERMINATED BY '\r\n'
(privilegename);

#-------------------------------------------------------------
#-- user
#-------------------------------------------------------------
select "loading user" as comment;

load data local infile 'initial_load_data/user.txt'
into table user
FIELDS TERMINATED BY '|'
LINES TERMINATED BY '\r\n'
(usershortname, username);

#-------------------------------------------------------------
#-- userprivilege
#-------------------------------------------------------------
select "loading userprivilege" as comment;

INSERT INTO userprivilege (userid, privilegeid)
  SELECT user.userid, privilege.privilegeid 
  FROM user, privilege
  WHERE user.usershortname = 'ksanter' and privilege.privilegename = 'superadmin';
INSERT INTO userprivilege (userid, privilegeid)
  SELECT user.userid, privilege.privilegeid 
  FROM user, privilege
  WHERE user.usershortname = 'test_admin' and privilege.privilegename = 'admin';
INSERT INTO userprivilege (userid, privilegeid)
  SELECT user.userid, privilege.privilegeid 
  FROM user, privilege
  WHERE user.usershortname = 'test_lead' and privilege.privilegename = 'lead';
INSERT INTO userprivilege (userid, privilegeid)
  SELECT user.userid, privilege.privilegeid 
  FROM user, privilege
  WHERE user.usershortname = 'test_instructor' and privilege.privilegename = 'instructor';

#-------------------------------------------------------------
#-- course
#-------------------------------------------------------------
select "loading course" as comment;
load data local infile 'initial_load_data/course.txt'
into table course
FIELDS TERMINATED BY '|'
LINES TERMINATED BY '\r\n'
(coursename, ap);

#-------------------------------------------------------------
#-- term
#-------------------------------------------------------------
select "loading term" as comment;
INSERT INTO term (termname, termgroupid) SELECT 'Sem 1', termgroupid FROM termgroup where termgroupname = 'semester';
INSERT INTO term (termname, termgroupid) SELECT 'Sem 2', termgroupid FROM termgroup where termgroupname = 'semester';
INSERT INTO term (termname, termgroupid) SELECT 'Tri 1', termgroupid FROM termgroup where termgroupname = 'trimester';
INSERT INTO term (termname, termgroupid) SELECT 'Tri 2', termgroupid FROM termgroup where termgroupname = 'trimester';
INSERT INTO term (termname, termgroupid) SELECT 'Tri 3', termgroupid FROM termgroup where termgroupname = 'trimester';
INSERT INTO term (termname, termgroupid) SELECT 'Summer', termgroupid FROM termgroup where termgroupname = 'summer';

#-------------------------------------------------------------
#-- usercourse
#-------------------------------------------------------------
select "loading usercourse" as comment;

INSERT INTO usercourse (userid, courseid, termgroupid) 
SELECT NULL as userid, NULL as courseid, termgroupid
FROM termgroup;

#-------------------------------------------------------------
#-- tip
#-------------------------------------------------------------
select "loading tip" as comment;

#--- load shared general tips from Instructors Corner (semester only)
load data local infile 'initial_load_data/tipdata_instructorscorner.txt'
into table tip
FIELDS TERMINATED BY '|'
LINES TERMINATED BY '\r\n'
(tiptext)
set userid = null;


#-------------------------------------------------------------
#-- mappedtip
#-------------------------------------------------------------
select "loading mappedtip" as comment;

#--- map shared general tips from Instructors Corner (semester only)
insert into mappedtip (tipid, usercourseid, week)
select 
  tipid, 
  usercourseid,
  cast(substring(tiptext from 10 for 2) as int) as week
from tip, usercourse
where tiptext like "[staging %"
  and usercourse.userid is NULL
  and usercourse.courseid is NULL
  and usercourse.termgroupid in (
    select termgroupid
    from termgroup
    where termgroupname = 'semester'
);

#--- remove [staging NN] tag from tiptext
update tip
set tiptext = substring(tiptext from 13);

