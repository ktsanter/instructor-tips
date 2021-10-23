#-----------------------------------------------------------------
#-- create DB for Recipes
#-----------------------------------------------------------------
select "creating recipes db" as comment;

DROP DATABASE IF EXISTS recipes;
CREATE DATABASE recipes;
USE recipes;

#-----------------------------------------------------------------
#-- tables
#-----------------------------------------------------------------
select "creating tables" as comment;

create table recipe  
(
  recipeid           int unsigned not null AUTO_INCREMENT,
  userid             int unsigned not null,
  recipename         varchar(200),
  reciperating       int unsigned not null,
  recipeyield        varchar(100),
  recipeinstructions mediumtext,
  recipenotes        varchar(500),
  recipemade         boolean not null default 0,
  
  primary key (recipeid),
  constraint foreign key (userid) references  instructortips.user (userid) on delete cascade,
  constraint unique(userid, recipename)
);

create table ingredient
(
  ingredientid      int unsigned not null AUTO_INCREMENT,
  recipeid          int unsigned not null,
  ingredientname    varchar(250),
  
  primary key(ingredientid),
  constraint foreign key (recipeid) references recipe(recipeid) on delete cascade
);

create table tag
(
  tagid             int unsigned not null AUTO_INCREMENT,
  userid            int unsigned not null,
  tagtext           varchar(20),
  
  primary key(tagid),
  constraint foreign key (userid) references  instructortips.user (userid) on delete cascade,
  constraint unique(userid, tagtext)
);

create table recipe_tag
(
  recipe_tagid      int unsigned not null AUTO_INCREMENT,
  recipeid          int unsigned not null,
  tagid             int unsigned not null,
  
  primary key(recipe_tagid),
  constraint foreign key (recipeid) references  recipe (recipeid) on delete cascade,
  constraint foreign key (tagid) references  tag (tagid) on delete cascade,
  constraint unique(recipeid, tagid)
);

create table menu
(
  menuid             int unsigned not null AUTO_INCREMENT,
  userid             int unsigned not null,
  recipeid           int unsigned not null,
  
  primary key (menuid),
  constraint foreign key (userid) references  instructortips.user (userid) on delete cascade,
  constraint foreign key (recipeid) references  recipe (recipeid) on delete cascade,
  constraint unique(userid, recipeid)
);

create table shopping
(
  shoppingid         int unsigned not null AUTO_INCREMENT,
  userid             int unsigned not null,
  ingredientid       int unsigned not null,
  ingredientchecked  boolean not null default 0,
  
  primary key (shoppingid),
  constraint foreign key (userid) references  instructortips.user (userid) on delete cascade,
  constraint foreign key (ingredientid) references  ingredient (ingredientid) on delete cascade,
  constraint unique(userid, ingredientid)
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

DELIMITER //
create procedure add_recipe(
  in user_Id int, 
  in recipe_Name varchar(200), 
  in recipe_Rating int,
  in recipe_Yield varchar(100),
  in recipe_Instructions mediumtext,
  in recipe_Notes varchar(500)
) 
begin
  insert into recipe (
    userid, recipename, reciperating, recipeyield, recipeinstructions, recipenotes
    
  ) values (
    user_Id, recipe_Name, recipe_Rating, recipe_Yield, recipe_Instructions, recipe_Notes
  );
  
  select LAST_INSERT_ID() as recipeid;
end;
//
DELIMITER ;

DELIMITER //
create procedure add_ingredient(
  in recipe_Id int, 
  in ingredient_Name varchar(250)
) 
begin
  insert into ingredient (
    recipeid, ingredientname
    
  ) values (
    recipe_Id, ingredient_Name
  );
  
  select LAST_INSERT_ID() as ingredientid;
end;
//
DELIMITER ;
