create or replace table commentset
(
  commentsetid     int unsigned not null AUTO_INCREMENT,
  userid           int unsigned not null,
  hierarchy        mediumtext null,
  
  primary key (commentsetid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade
);