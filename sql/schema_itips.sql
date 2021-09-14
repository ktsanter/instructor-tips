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
create table dummy
(
  dummyid          int unsigned not null AUTO_INCREMENT,
  userid           int unsigned not null,
  
  primary key (dummyid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade
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
    