#-----------------------------------------------------------------
#-- create End date manager
#-----------------------------------------------------------------
select "creating enddatemanager db" as comment;

DROP DATABASE IF EXISTS enddatemanager;
CREATE DATABASE enddatemanager;
USE enddatemanager;

#-----------------------------------------------------------------
#-- tables
#-----------------------------------------------------------------
select "creating tables" as comment;

create table test
(
  testid             int unsigned not null AUTO_INCREMENT,
  userid                int unsigned not null,
  someval             varchar(200) null,
  
  primary key (testid),
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
