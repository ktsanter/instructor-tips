#-----------------------------------------------------------------
#-- create whitelist of schemas, tables, and columns
#-----------------------------------------------------------------
select "creating whitelist" as comment;

USE instructortips;

#-----------------------------------------------------------------
#-- tables
#-----------------------------------------------------------------
select "creating tables" as comment;

create or replace table privatized_column
(
  privateizedcolumnid      int unsigned not null AUTO_INCREMENT,
  schema_name              varchar(64) null,
  table_name               varchar(64) null,
  column_name              varchar(64) null,
  is_private                int unsigned not null,
  
  primary key (privateizedcolumnid),
  constraint unique(schema_name, table_name, column_name)
);

#--------------------------------------------------------------------------
#-- triggers
#--------------------------------------------------------------------------
select "creating triggers" as comment;
        
#--------------------------------------------------------------------------
#-- views
#--------------------------------------------------------------------------
select "creating views" as comment;

create or replace view whitelist_schema as
  select schema_name 
  from information_schema.schemata 
  where schema_name not in ('mysql', 'information_schema', 'performance_schema');
  
create or replace view whitelist_table as
  select table_schema, table_name, table_type
  from information_schema.tables
  where table_schema in (
    select schema_name from whitelist_schema
  );
  
create or replace view whitelist_column as
  select 
    wc.table_schema, wc.table_name, wc.column_name, wc.column_type, wc.column_key, wc.is_nullable, wc.ordinal_position,
    not isnull(pc.is_private) as is_private 
  from (
    select table_schema, table_name, column_name, column_type, column_key, is_nullable, ordinal_position
    from information_schema.columns
    where concat(table_schema, '.', table_name) in (
      select concat(table_schema, '.', table_name)
      from whitelist_table
    )
  ) as wc 
  left outer join (
    select schema_name, table_name, column_name, is_private
    from privatized_column
  ) as pc
  on (
    wc.table_schema = pc.schema_name and
    wc.table_name = pc.table_name and
    wc.column_name = pc.column_name
  ); 
     
#--------------------------------------------------------------------------
#-- stored procedures
#--------------------------------------------------------------------------
select "creating stored procedures" as comment;

#--------------------------------------------------------------------------
#-- initializing data
#--------------------------------------------------------------------------
select "initializing data" as comment;

#-- instructor tips
insert into privatized_column (schema_name, table_name, column_name, is_private)
  values ('instructortips', 'user', 'password', true);
insert into privatized_column (schema_name, table_name, column_name, is_private)
  values ('instructortips', 'user', 'email', true);

#-- sessionstore
insert into privatized_column (schema_name, table_name, column_name, is_private)
  values ('sessionstore', 'sessions', 'data', true);
insert into privatized_column (schema_name, table_name, column_name, is_private)
  values ('sessionstore', 'sessions', 'session_id', true);

#-- commentbuddy
insert into privatized_column (schema_name, table_name, column_name, is_private)
  values ('commentbuddy', 'accesskey', 'accesskey', true);

#-- enddatemanager
insert into privatized_column (schema_name, table_name, column_name, is_private)
  values ('enddatemanager', 'configuration', 'calendarid', true);
