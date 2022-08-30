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
  linktext           varchar(50) not null,
  linkurl            varchar(300) not null,
  
  primary key (resourcelinkid),
  constraint unique(templateitem)  
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

insert into resourcelink (templateitem, linktext, linkurl)
values 
  ("customer care", "Customer Care Center", "https://michiganvirtual.org/about/support/" ) ,
  ("mentor page", "Mentor Page", "https://michiganvirtual.org/professionals/mentors/" ),
  ("academic integrity policy", "Academic Integrity Policy", "https://michiganvirtual.org/policies/academic-integrity-policy/" ),
  ("grading policy and expectations", "Grading Policy and Expectations", "https://michiganvirtual.org/about/support/knowledge-base/michigan-virtual-grading-policy-and-expectations" ),
  ("ap policy", "Advanced Placement Policy", "https://michiganvirtual.org/about/support/knowledge-base/advanced-placement-course-policy" )
