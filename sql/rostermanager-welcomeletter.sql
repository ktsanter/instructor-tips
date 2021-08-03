use rostermanager;

create or replace table mentorextra
(
  mentorextraid          int unsigned not null AUTO_INCREMENT,
  userid                 int unsigned not null,
  term                   varchar(200) not null,
  section                varchar(200) not null,
  name                   varchar(200) not null,
  welcomelettersent      int unsigned not null,
  
  primary key (mentorextraid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade
);