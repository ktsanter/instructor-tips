drop procedure if exists find_or_add_tip;

DELIMITER //
create procedure find_or_add_tip(in user_Id int, in tip_Content varchar(2000))
begin
  set @tip_Id = null;
  select a.tipid into @tip_Id
  from tip as a
  where a.userid = user_Id
    and a.tipcontent = tip_Content
  limit 1;
    
  if @tip_Id is null then
    insert into tip (userid, tipcontent)
    values(user_Id, tip_Content);

    select LAST_INSERT_ID() into @tip_Id;
  end if;
  
  select @tip_Id as 'tipid';
end;
//
DELIMITER ;

/* %3Cp%3Etip%20C%3C%2Fp%3E */