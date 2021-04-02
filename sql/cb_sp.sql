DELIMITER //
create procedure add_comment(in user_Id int, in comment_Text varchar(4000))
begin
  insert into comment (
    userid,
    tags,
    hovertext,
    commenttext
  ) values (
    user_Id,
    "",
    "",
    comment_Text
  );
  
  select 
    LAST_INSERT_ID() as commentid;
end;
//
DELIMITER ;
