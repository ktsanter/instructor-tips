source schema_recipes.sql;

call add_recipe(1,'first recipe', 3, "", "do some stuff", "these are important notes");
call add_recipe(1,'second recipe', 2, "", "mix it all up", "do not burn it");
call add_recipe(1,'third recipe', 2, "2 dozen", "1) do something\n2) do something else\n3) do one more thing", "only use imported ingredients");
call add_recipe(1,'fourth recipe', 1, "as much as you by", "1) buy cookies\n2) serve cookies", "");

insert into ingredient (recipeid, ingredientname) values(2, 'parsley');
insert into ingredient (recipeid, ingredientname) values(2, 'yak milk');
insert into ingredient (recipeid, ingredientname) values(3, '1 eye of newt');
insert into ingredient (recipeid, ingredientname) values(3, '3 cloves garlic');
insert into ingredient (recipeid, ingredientname) values(3, '1 1/2 Tbsp nightshade');
insert into ingredient (recipeid, ingredientname) values(4, 'cookies');

insert into tag (userid, tagtext) values (1, 'breakfast');
insert into tag (userid, tagtext) values (1, 'lunch');
insert into tag (userid, tagtext) values (1, 'dinner');
insert into tag (userid, tagtext) values (1, 'garlic');

insert into recipe_tag(recipeid, tagid) values(1,3);
insert into recipe_tag(recipeid, tagid) values(2,2);
insert into recipe_tag(recipeid, tagid) values(3,1);
insert into recipe_tag(recipeid, tagid) values(3,4);

insert into menu(userid, recipeid) values(1, 2);
insert into menu(userid, recipeid) values(1, 3);

call add_recipe(15, "recipe for other user", 2, "a bunch", "do some steps", "dummy notes");
insert into ingredient (recipeid, ingredientname) values(5, "fig newtons");
insert into menu(userid, recipeid) values(15, 5);
