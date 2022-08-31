#-----------------------------------------------------------------
#-- create DB for Course Policies
#-----------------------------------------------------------------
select "creating course policies db" as comment;

DROP DATABASE IF EXISTS coursepolicies;
CREATE DATABASE coursepolicies;
USE coursepolicies;

#-----------------------------------------------------------------
#-- tables
#-----------------------------------------------------------------
select "creating tables" as comment;

create table contact
(
  contactid          int unsigned not null AUTO_INCREMENT,
  contentdescriptor  varchar(50) not null,
  firstname          varchar(50) not null,
  lastname           varchar(50) not null,
  phone              varchar(20) not null,
  email              varchar(50) not null,
  templatebase       varchar(50) not null,
  
  primary key (contactid),
  constraint unique(contentdescriptor)  
);

create table resourcelink
(
  resourcelinkid     int unsigned not null AUTO_INCREMENT,
  templateitem       varchar(50) not null,
  restriction        varchar(20) not null,
  linktext           varchar(50) not null,
  linkurl            varchar(300) not null,
  
  primary key (resourcelinkid),
  constraint unique(templateitem)  
);


create table expectation
(
  expectationid     int unsigned not null AUTO_INCREMENT,
  target            varchar(20) not null,
  expectationtext   varchar(300) not null,
  restriction       varchar(20) not null,
  
  primary key (expectationid),
  constraint unique(target, expectationtext)  
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

insert into contact (contentdescriptor, firstname, lastname, phone, email, templatebase)
values 
  ("mentor coordinator", "Katie", "Hansen", "(517) 664-5470", "khansen2@michiganvirtual.org", "mentor support"),
  ("special populations coordinator", "Tom", "Ballew", "(517) 999-9999", "tballew@michiganvirtual.org", "special populations");

insert into resourcelink (templateitem, restriction, linktext, linkurl)
values 
  ("customer care", "none", "Customer Care Center", "https://michiganvirtual.org/about/support/" ) ,
  ("mentor page", "none", "Mentor Page", "https://michiganvirtual.org/professionals/mentors/" ),
  ("academic integrity policy", "none", "Academic Integrity Policy", "https://michiganvirtual.org/policies/academic-integrity-policy/" ),
  ("grading policy and expectations", "none", "Grading Policy and Expectations", "https://michiganvirtual.org/about/support/knowledge-base/michigan-virtual-grading-policy-and-expectations" ),
  ("ap policy", "ap", "Advanced Placement Policy", "https://michiganvirtual.org/about/support/knowledge-base/advanced-placement-course-policy" );
  
insert into expectation(target, restriction, expectationtext)
values
  ("student", "none", "Log in at least every school day."),
  ("student", "ap", "Be familiar with Michigan Virtual's AP Course Policy, especially concerning due dates and late penalties."),
  ("student", "non-ap", "Effectively manage time, using the pacing guide."),
  ("student", "none", "Be familiar with our Academic Integrity Policy."),
  ("student", "none", "Check SLP messages and the Teacher Feed every day."),
  ("student", "none", "Be respectful and considerate when communicating and working with classmates.");
  
  
insert into expectation(target, restriction, expectationtext)
values
  ("instructor", "none", "Always treat students with respect and friendliness, doing my best to encourage their learning and growth."),
  ("instructor", "none", "Respond to any communication 24 hours (not counting weekends and holidays)."),
  ("instructor", "none", "Grade all assignments, providing solid feedback, within 72 hours (not counting weekends and holidays)."),
  ("instructor", "none", "Provide progress reports at least monthly."),
  ("instructor", "none", "Help explain difficult concepts and provide additional support material."),
  ("instructor", "none", "Make weekly posts in the Teacher Feed, with tips, resources, and support."),
  ("instructor", "none", "Be an active member of the class discussions.");
