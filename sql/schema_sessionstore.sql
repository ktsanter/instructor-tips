SELECT "creating sessionstore db" as comment;

DROP DATABASE IF EXISTS sessionstore;
CREATE DATABASE sessionstore;
USE sessionstore;
CREATE TABLE IF NOT EXISTS sessions (
  session_id varchar(128) NOT NULL,
  expires int(11) unsigned NOT NULL,
  data mediumtext,
  PRIMARY KEY (session_id)
);
