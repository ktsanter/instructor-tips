create table temp_commentset
(
  commentsetid     int unsigned not null AUTO_INCREMENT,
  userid           int unsigned not null,
  hierarchy        varchar(20000) null,
  
  primary key (commentsetid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade
);


