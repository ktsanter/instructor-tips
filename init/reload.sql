DROP DATABASE IF EXISTS sessionstore;
DROP DATABASE IF EXISTS treasurehunt;
DROP DATABASE IF EXISTS instructortip;
DROP DATABASE IF EXISTS pacingguide;
SOURCE /sql/schema_sessionstore.sql;
SOURCE /sql/schema_instructortips.sql;
SOURCE /sql/loadadmindata.sql;
SOURCE /sql/schema_treasurehunt.sql;
SOURCE /sql/schema_pacingguide.sql;