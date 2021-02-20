DELIMITER //
create or replace procedure add_default_optionvalues(in table_name varchar(200))
begin
  if table_name = "exam" then
    insert into exam (
      examdescription
    ) values (
      "default value"
    );
    
  elseif table_name = "proctoring" then
    insert into proctoring (
      proctoringdescription
    ) values (
      "default value"
    );
    
  elseif table_name = "resubmission" then
    insert into resubmission (
      resubmissiondescription
    ) values (
      "default value"
    );
    
  elseif table_name = "retake" then
    insert into retake (
      retakedescription
    ) values (
      "default value"
    );
    
  elseif table_name = "generalkeypoint" then
    insert into generalkeypoint (
      keypoint,
      ap,
      student,
      mentor
    ) values (
      "default value",
      false,
      false,
      false
    );
    
  else
    select "fail" as "result";
  end if;
  
  select LAST_INSERT_ID() as courseid;
end;
//
DELIMITER ;