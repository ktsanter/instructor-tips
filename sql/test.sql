#create view options_tableinfo as
#  select t.tipid, t.userid, t.tiptext, t.common, jtc.categoryid, jtc.categorytext
#  from tip as t 
#  left outer join (
#    select tc.tipid, tc.categoryid, c.categorytext
#    from tipcategory as tc, category as c
#    where tc.categoryid = c.categoryid
#  ) as jtc on (
#    t.tipid = jtc.tipid
#  );

create or replace view options_tableinfo as 
  select 
    table_name, 
    column_name,
    data_type,
    column_type,
    character_maximum_length
    is_nullable
  from information_schema.COLUMNS 
  where table_schema = DATABASE();