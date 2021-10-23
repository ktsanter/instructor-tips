use recipes;

alter table recipe
add column recipemade boolean not null default 0;
