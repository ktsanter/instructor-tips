use recipes;

drop procedure if exists add_recipe;


DELIMITER //
create procedure add_recipe(
  in user_Id int, 
  in recipe_Name varchar(200), 
  in recipe_Rating int,
  in recipe_Yield varchar(100),
  in recipe_Instructions mediumtext,
  in recipe_Notes varchar(500),
  in recipe_Made int,
  in recipe_Image varchar(400)
) 
begin
  insert into recipe (
    userid, recipename, reciperating, recipeyield, recipeinstructions, recipenotes, recipemade, recipeimage
    
  ) values (
    user_Id, recipe_Name, recipe_Rating, recipe_Yield, recipe_Instructions, recipe_Notes, recipe_Made, recipe_Image
  );
  
  select LAST_INSERT_ID() as recipeid;
end;
//
DELIMITER ;