DROP DATABASE IF EXISTS sessionstore;
DROP DATABASE IF EXISTS treasurehunt;
DROP DATABASE IF EXISTS instructortip;
SOURCE schema_sessionstore.sql;
SOURCE schema_instructortips.sql;
SOURCE loadadmindata.sql;
SOURCE schema_treasurehunt.sql;