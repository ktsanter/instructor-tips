#-----------------------------------------------------------------
#-- create DB for Who Teaches What
#-----------------------------------------------------------------
select "creating who teaches what db" as comment;

DROP DATABASE IF EXISTS whoteacheswhat;
CREATE DATABASE whoteacheswhat;
USE whoteacheswhat;

#-----------------------------------------------------------------
#-- tables
#-----------------------------------------------------------------
select "creating tables" as comment;

create table assignment
(
  assignmentid     int unsigned not null AUTO_INCREMENT,
  course           varchar(200) not null,
  instructor       varchar(50) not null,
  term             varchar(20) not null,
  
  primary key (assignmentid),
  constraint unique(course, instructor, term)  
);

create table extracourse
(
  extracourseid    int unsigned not null AUTO_INCREMENT,
  course           varchar(200) not null,  
  coursetype       varchar(20) not null,
  
  primary key (extracourseid),
  constraint unique(course, coursetype)
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

#--------------------------------------------------------------------------
#-- preliminary data
#--------------------------------------------------------------------------
select "loading preliminary data" as comment;

insert into extracourse (course, coursetype)
values 
  ("AP Computer Prinicpals (MV Fall 2018)", "AP"),
  ("AP Computer Science A&B (FLVS)", "AP"),
  ("Computer Basics - Google", "MS");

    