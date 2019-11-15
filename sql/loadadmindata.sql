USE instructortips;

DELETE FROM tipstatus;
DELETE FROM generaltip;
DELETE FROM coursetip;
DELETE FROM tip;

DELETE FROM userprivilege;
DELETE FROM privilege;
DELETE FROM user;

DELETE FROM courseterm;
DELETE FROM course;

DELETE FROM term;
DELETE FROM termgroup;

INSERT INTO privilege SET privilegename = 'superadmin';
INSERT INTO privilege SET privilegename = 'admin';
INSERT INTO privilege SET privilegename = 'lead';
INSERT INTO privilege SET privilegename = 'instructor';

INSERT INTO user SET usershortname = 'ksanter', username = 'Kevin Santer';
INSERT INTO user SET usershortname = 'nsanter', username = 'Noah Santer';
INSERT INTO user SET usershortname = 'bubba', username = 'Bubba McStabbypants';
INSERT INTO user SET usershortname = 'carlos', username = 'Charles Chorkenheimer';

INSERT INTO userprivilege (userid, privilegeid)
  SELECT user.userid, privilege.privilegeid 
  FROM user, privilege
  WHERE user.usershortname = 'ksanter' and privilege.privilegename = 'superadmin';
INSERT INTO userprivilege (userid, privilegeid)
  SELECT user.userid, privilege.privilegeid 
  FROM user, privilege
  WHERE user.usershortname = 'nsanter' and privilege.privilegename = 'admin';
INSERT INTO userprivilege (userid, privilegeid)
  SELECT user.userid, privilege.privilegeid 
  FROM user, privilege
  WHERE user.usershortname = 'bubba' and privilege.privilegename = 'lead';
INSERT INTO userprivilege (userid, privilegeid)
  SELECT user.userid, privilege.privilegeid 
  FROM user, privilege
  WHERE user.usershortname = 'carlos' and privilege.privilegename = 'instructor';

INSERT INTO termgroup SET termgroupname = 'semester', termlength = 18;
INSERT INTO termgroup SET termgroupname = 'trimester', termlength = 12;
INSERT INTO termgroup SET termgroupname = 'summer', termlength = 10;

INSERT INTO term (termname, termgroupid) SELECT 'Sem 1', termgroupid FROM termgroup where termgroupname = 'semester';
INSERT INTO term (termname, termgroupid) SELECT 'Sem 2', termgroupid FROM termgroup where termgroupname = 'semester';
INSERT INTO term (termname, termgroupid) SELECT 'Tri 1', termgroupid FROM termgroup where termgroupname = 'trimester';
INSERT INTO term (termname, termgroupid) SELECT 'Tri 2', termgroupid FROM termgroup where termgroupname = 'trimester';
INSERT INTO term (termname, termgroupid) SELECT 'Tri 3', termgroupid FROM termgroup where termgroupname = 'trimester';
INSERT INTO term (termname, termgroupid) SELECT 'Summer', termgroupid FROM termgroup where termgroupname = 'summer';

INSERT INTO course set coursename='AP Computer Science Principles (S1)', ap = true;
INSERT INTO course set coursename='AP Computer Science Principles (S2)', ap = true;
INSERT INTO course set coursename='Java Programming A', ap = false;
INSERT INTO course set coursename='Basic Web Design: HTML & CSS', ap = false;

INSERT INTO courseterm (courseid, termgroupid)
SELECT courseid, termgroupid
FROM course, termgroup
WHERE course.coursename = 'AP Computer Science Principles (S1)'
AND termgroup.termgroupname = 'semester';

INSERT INTO courseterm (courseid, termgroupid)
SELECT courseid, termgroupid
FROM course, termgroup
WHERE course.coursename = 'AP Computer Science Principles (S2)'
AND termgroup.termgroupname = 'semester';

INSERT INTO tipstatus (tipstatusname) VALUES ('scheduled');
INSERT INTO tipstatus (tipstatusname) VALUES ('completed');
