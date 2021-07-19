create or replace table enrollment
(
  enrollmentid     int unsigned not null AUTO_INCREMENT,
  userid           int unsigned not null,
  student          varchar(200) not null,
  term             varchar(200) not null,
  section          varchar(200) not null,
  startdate        varchar(30) not null,
  enddate          varchar(30) not null,
  email            varchar(200) not null,
  affiliation      varchar(200) not null,
  
  primary key (enrollmentid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade
);

create or replace table mentor
(
  mentorid         int unsigned not null AUTO_INCREMENT,
  userid           int unsigned not null,
  student          varchar(200) not null,
  term             varchar(200) not null,
  section          varchar(200) not null,
  name             varchar(200) not null,
  email            varchar(200) not null,
  phone            varchar(200) not null,
  affiliation      varchar(200) not null,
  affiliationphone varchar(200) not null,
  
  primary key (mentorid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade
);

create or replace table guardian
(
  guardianid       int unsigned not null AUTO_INCREMENT,
  userid           int unsigned not null,
  student          varchar(200) not null,
  term             varchar(200) not null,
  section          varchar(200) not null,
  name             varchar(200) not null,
  email            varchar(200) not null,
  phone            varchar(200) not null,
  affiliation      varchar(200) not null,
  affiliationphone varchar(200) not null,
  
  primary key (guardianid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade
);

create or replace table iep
(
  iepid       int unsigned not null AUTO_INCREMENT,
  userid           int unsigned not null,
  student          varchar(200) not null,
  term             varchar(200) not null,
  section          varchar(200) not null,
  
  primary key (iepid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade
);

create or replace table student504
(
  student504id     int unsigned not null AUTO_INCREMENT,
  userid           int unsigned not null,
  student          varchar(200) not null,
  term             varchar(200) not null,
  section          varchar(200) not null,
  
  primary key (student504id),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade
);

create or replace table homeschooled
(
  homeschooledid       int unsigned not null AUTO_INCREMENT,
  userid           int unsigned not null,
  student          varchar(200) not null,
  term             varchar(200) not null,
  section          varchar(200) not null,
  
  primary key (homeschooledid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade
);
