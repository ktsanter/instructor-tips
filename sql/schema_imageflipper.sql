#-----------------------------------------------------------------
#-- create DB for Image flipper
#-----------------------------------------------------------------
select "creating imageflipper db" as comment;

DROP DATABASE IF EXISTS imageflipper;
CREATE DATABASE imageflipper;
USE imageflipper;

#-----------------------------------------------------------------
#-- tables
#-----------------------------------------------------------------
select "creating tables" as comment;

create table project
(
  projectid             int unsigned not null AUTO_INCREMENT,
  userid                int unsigned not null,
  projectname           varchar(200) not null,
  projecttitle          varchar(200) not null,
  projectsubtitle       varchar(200) not null,
  colorscheme           varchar(200) not null,
  layoutrows            int unsigned not null,
  layoutcols            int unsigned not null,
  
  primary key (projectid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade
);

create table layoutimage
(
  layoutimageid         int unsigned not null AUTO_INCREMENT,
  projectid             int unsigned not null,
  imageindex            int unsigned not null,
  imageurl              varchar(200) not null,
  
  primary key (layoutimageid),
  constraint unique(projectid, imageindex),
  constraint foreign key (projectid) references project (projectid) on delete cascade
);

create table projectpreview
(
  userid                int unsigned not null,
  snapshot              JSON,
  
  primary key (userid),
  constraint foreign key (userid) references instructortips.user (userid) on delete cascade
);

#--------------------------------------------------------------------------
#-- triggers
#--------------------------------------------------------------------------
select "creating triggers" as comment;

#-- add default image info for new projects
CREATE TRIGGER trigger_newproject
  AFTER INSERT ON project FOR EACH ROW
    call add_default_images(new.projectid, 36);
        
#--------------------------------------------------------------------------
#-- views
#--------------------------------------------------------------------------
select "creating views" as comment;
    
#--------------------------------------------------------------------------
#-- stored procedures
#--------------------------------------------------------------------------
select "creating stored procedures" as comment;
    
DELIMITER //
create procedure add_default_project(in user_Id int)
begin
  select max(projectid)+1 into @maxproj from project where userid = user_Id;
  if @maxproj is null then select 1 into @maxproj; end if;
  
  insert into project(
    userid, 
    projectname, projecttitle, projectsubtitle,
    colorscheme,
    layoutrows, layoutcols
  ) values (
    user_Id,
    concat('default name ', @maxproj) , 'default title', 'default subtitle',
    'flipper-colorscheme-000',
    4, 5
  );
  
  select LAST_INSERT_ID() as projectid;
end;
//
DELIMITER ;

DELIMITER //
create procedure add_default_images(in projid int, in imagecount int)
begin
  for i in 0..(imagecount - 1) do
    insert into layoutimage(projectid, imageindex, imageurl) 
    values(projid, i, "");
  end for;
end;
//
DELIMITER ;