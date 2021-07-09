drop table if exists project_backup;
create table project_backup like project;
insert into project_backup select * from project;

alter table project modify hierarchy mediumtext;
