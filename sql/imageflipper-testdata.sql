#------------------------------------------------------------
#-- Image flipper test data
#------------------------------------------------------------

select "loading Image flipper test data..." as comment;

USE imageflipper;

select "deleting from tables" as comment;

DELETE FROM project;

#-------------------------------------------------------------
#-- project
#-------------------------------------------------------------
select "loading project" as comment;

insert into project(
  userid,
  projectname,
  projecttitle,
  projectsubtitle,
  colorscheme,
  layoutrows,
  layoutcols
) values (
  1, # assumed to be KTS
  'proj1',
  'title for proj1',
  'subtitle for proj1',
  'flipper-colorscheme-000',
  4,
  5
);

insert into project(
  userid,
  projectname,
  projecttitle,
  projectsubtitle,
  colorscheme,
  layoutrows,
  layoutcols
) values (
  1, # assumed to be KTS
  'proj2',
  'title for proj2',
  'subtitle for proj2',
  'flipper-colorscheme-001',
  3,
  3
);

