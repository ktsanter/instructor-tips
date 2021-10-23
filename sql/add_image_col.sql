use recipes;

alter table recipe
add column recipeimage varchar(300) not null default "";
