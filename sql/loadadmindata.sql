#------------------------------------------------------------
#-- initial admin data load
#------------------------------------------------------------

select "loading admin data..." as comment;

USE instructortips;

select "deleting from tables" as comment;

DELETE FROM userprivilege;
DELETE FROM privilege;
DELETE FROM user;
DELETE from tipcategory;
DELETE from scheduletip;
DELETE FROM category;
DELETE FROM tip;
DELETE FROM schedule;

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
(usershortname, username, email);

#-------------------------------------------------------------
#-- userprivilege
#-------------------------------------------------------------
select "updating userprivilege - disabled" as comment;
#--
#--INSERT INTO userprivilege (userid, privilegeid)
#--  SELECT user.userid, privilege.privilegeid 
#--   FROM user, privilege
#--   WHERE user.usershortname = 'ksanter' and privilege.privilegename = 'superadmin';
#-- INSERT INTO userprivilege (userid, privilegeid)
#--   SELECT user.userid, privilege.privilegeid 
#--   FROM user, privilege
#--   WHERE user.usershortname = 'test_admin' and privilege.privilegename = 'admin';
#-- INSERT INTO userprivilege (userid, privilegeid)
#--   SELECT user.userid, privilege.privilegeid 
#--   FROM user, privilege
#--   WHERE user.usershortname = 'test_lead' and privilege.privilegename = 'lead';
#-- INSERT INTO userprivilege (userid, privilegeid)
#--   SELECT user.userid, privilege.privilegeid 
#--   FROM user, privilege
#--   WHERE user.usershortname = 'test_instructor' and privilege.privilegename = 'instructor';

#-------------------------------------------------------------
#-- category
#-------------------------------------------------------------
select "loading category" as comment;

INSERT INTO category (categorytext) SELECT 'course prep';
INSERT INTO category (categorytext) SELECT 'course launch';
INSERT INTO category (categorytext) SELECT 'progress check';
INSERT INTO category (categorytext) SELECT 'check-in / concerns';
INSERT INTO category (categorytext) SELECT 'ESR';
INSERT INTO category (categorytext) SELECT 'engagement';
INSERT INTO category (categorytext) SELECT 'reminder';
INSERT INTO category (categorytext) SELECT 'course end';
INSERT INTO category (categorytext) SELECT 'reflection';

#-------------------------------------------------------------
#-- tip
#-------------------------------------------------------------
select "loading tip" as comment;

drop table if exists tip_staging;

CREATE TABLE tip_staging
(
  tiptext   varchar(1000) NOT NULL ,
  categorytext      varchar(100) NOT NULL 
);

load data local infile 'initial_load_data/tip.txt' /*'initial_load_data/tipdata2_instructorscorner.txt'*/
into table tip_staging
FIELDS TERMINATED BY '|'
LINES TERMINATED BY '\r\n'
(tiptext, categorytext);

insert into tip(tiptext, common, userid)
select ts.tiptext, TRUE, NULL
from tip_staging as ts;

#-------------------------------------------------------------
#-- tipcategory
#-------------------------------------------------------------
select "loading tipcategory" as comment;

insert into tipcategory(tipid, categoryid)
select t.tipid, c.categoryid
from 
  tip_staging as ts,
  tip as t,  
  category as c 
  where ts.tiptext = t.tiptext
    and ts.categorytext = c.categorytext;
