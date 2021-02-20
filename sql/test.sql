create or replace view coursecount as 
  select 
    1 as ap, 
    count(courseid) as "usagecount" 
  from course 
  where ap = 1 

  union 

  select 
    0 as ap, 
    count(courseid) as "usagecount" 
  from course 
  where ap = 0;