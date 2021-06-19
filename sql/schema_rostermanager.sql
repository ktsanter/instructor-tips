#-----------------------------------------------------------------
#-- create DB for Roster Manager
#-----------------------------------------------------------------
select "creating roster manager db" as comment;

DROP DATABASE IF EXISTS rostermanager;
CREATE DATABASE rostermanager;
USE rostermanager;

#-----------------------------------------------------------------
#-- tables
#-----------------------------------------------------------------
select "creating tables" as comment;

#----------------------------------------------------------------------
create table test
(
  testid                int unsigned not null AUTO_INCREMENT,
  userid                int unsigned not null,
  testname              varchar(200) not null,
  
  primary key (testid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade,
  constraint unique(userid, testname)
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
    