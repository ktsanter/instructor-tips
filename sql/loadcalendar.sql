#---------------------------------------------------
#-- stage then load calendar data
#---------------------------------------------------
select 'loading calendar...';
USE instructortips;

drop table if exists calendar_staging;

create table calendar_staging
(
  schoolyear	varchar(30),
  termname	  varchar(30),
  starttype	  varchar(30),
  startdate	  varchar(30),
  enddate	    varchar(30),
  week1	      varchar(30),
  week2	      varchar(30),
  week3	      varchar(30),
  week4	      varchar(30),
  week5	      varchar(30),
  week6	      varchar(30),
  week7	      varchar(30),
  week8	      varchar(30),
  week9	      varchar(30),
  week10	    varchar(30),
  week11	    varchar(30),
  week12	    varchar(30),
  week13	    varchar(30),
  week14	    varchar(30),
  week15	    varchar(30),
  week16	    varchar(30),
  week17	    varchar(30),
  week18      varchar(30)
);

select "loading staging data for calendar...";

load data local infile 'initial_load_data/calendar staging - staged.csv'
into table calendar_staging
FIELDS TERMINATED BY ','
LINES TERMINATED BY '\r\n'
IGNORE 1 LINES
(
  schoolyear,
  termname,
  starttype,
  startdate,
  enddate,
  week1,
  week2,
  week3,
  week4,
  week5,
  week6,
  week7,
  week8,
  week9,
  week10,
  week11,
  week12,
  week13,
  week14,
  week15,
  week16,
  week17,
  week18
);

delete from calendar where schoolyear = '2019-2020';

#--- weeks 1 through 10 for all terms
insert into calendar(termid, schoolyear, week, firstday, starttype)
select t.termid, c.schoolyear, 1 as week, str_to_date(c.week1, '%c/%e/%Y') as firstday, c.starttype
from calendar_staging as c, term as t
where c.termname = t.termname;

insert into calendar(termid, schoolyear, week, firstday, starttype)
select t.termid, c.schoolyear, 2 as week, str_to_date(c.week2, '%c/%e/%Y') as firstday, c.starttype
from calendar_staging as c, term as t
where c.termname = t.termname;

insert into calendar(termid, schoolyear, week, firstday, starttype)
select t.termid, c.schoolyear, 3 as week, str_to_date(c.week3, '%c/%e/%Y') as firstday, c.starttype
from calendar_staging as c, term as t
where c.termname = t.termname;

insert into calendar(termid, schoolyear, week, firstday, starttype)
select t.termid, c.schoolyear, 4 as week, str_to_date(c.week4, '%c/%e/%Y') as firstday, c.starttype
from calendar_staging as c, term as t
where c.termname = t.termname;

insert into calendar(termid, schoolyear, week, firstday, starttype)
select t.termid, c.schoolyear, 5 as week, str_to_date(c.week5, '%c/%e/%Y') as firstday, c.starttype
from calendar_staging as c, term as t
where c.termname = t.termname;

insert into calendar(termid, schoolyear, week, firstday, starttype)
select t.termid, c.schoolyear, 6 as week, str_to_date(c.week6, '%c/%e/%Y') as firstday, c.starttype
from calendar_staging as c, term as t
where c.termname = t.termname;

insert into calendar(termid, schoolyear, week, firstday, starttype)
select t.termid, c.schoolyear, 7 as week, str_to_date(c.week7, '%c/%e/%Y') as firstday, c.starttype
from calendar_staging as c, term as t
where c.termname = t.termname;

insert into calendar(termid, schoolyear, week, firstday, starttype)
select t.termid, c.schoolyear, 8 as week, str_to_date(c.week8, '%c/%e/%Y') as firstday, c.starttype
from calendar_staging as c, term as t
where c.termname = t.termname;

insert into calendar(termid, schoolyear, week, firstday, starttype)
select t.termid, c.schoolyear, 9 as week, str_to_date(c.week9, '%c/%e/%Y') as firstday, c.starttype
from calendar_staging as c, term as t
where c.termname = t.termname;

insert into calendar(termid, schoolyear, week, firstday, starttype)
select t.termid, c.schoolyear, 10 as week, str_to_date(c.week10, '%c/%e/%Y') as firstday, c.starttype
from calendar_staging as c, term as t
where c.termname = t.termname;

#--- weeks 11 through 12 for all semester, trimester
insert into calendar(termid, schoolyear, week, firstday, starttype)
select t.termid, c.schoolyear, 11 as week, str_to_date(c.week11, '%c/%e/%Y') as firstday, c.starttype
from calendar_staging as c, term as t
where c.termname = t.termname
  and c.termname in ('Sem 1', 'Sem 2', 'Tri 1', 'Tri 2', 'Tri 3');

insert into calendar(termid, schoolyear, week, firstday, starttype)
select t.termid, c.schoolyear, 12 as week, str_to_date(c.week12, '%c/%e/%Y') as firstday, c.starttype
from calendar_staging as c, term as t
where c.termname = t.termname
  and c.termname in ('Sem 1', 'Sem 2', 'Tri 1', 'Tri 2', 'Tri 3');

#--- weeks 13 through 18 for all semester
insert into calendar(termid, schoolyear, week, firstday, starttype)
select t.termid, c.schoolyear, 13 as week, str_to_date(c.week13, '%c/%e/%Y') as firstday, c.starttype
from calendar_staging as c, term as t
where c.termname = t.termname
  and c.termname in ('Sem 1', 'Sem 2');

insert into calendar(termid, schoolyear, week, firstday, starttype)
select t.termid, c.schoolyear, 14 as week, str_to_date(c.week14, '%c/%e/%Y') as firstday, c.starttype
from calendar_staging as c, term as t
where c.termname = t.termname
  and c.termname in ('Sem 1', 'Sem 2');

insert into calendar(termid, schoolyear, week, firstday, starttype)
select t.termid, c.schoolyear, 15 as week, str_to_date(c.week15, '%c/%e/%Y') as firstday, c.starttype
from calendar_staging as c, term as t
where c.termname = t.termname
  and c.termname in ('Sem 1', 'Sem 2');

insert into calendar(termid, schoolyear, week, firstday, starttype)
select t.termid, c.schoolyear, 16 as week, str_to_date(c.week16, '%c/%e/%Y') as firstday, c.starttype
from calendar_staging as c, term as t
where c.termname = t.termname
  and c.termname in ('Sem 1', 'Sem 2');

insert into calendar(termid, schoolyear, week, firstday, starttype)
select t.termid, c.schoolyear, 17 as week, str_to_date(c.week17, '%c/%e/%Y') as firstday, c.starttype
from calendar_staging as c, term as t
where c.termname = t.termname
  and c.termname in ('Sem 1', 'Sem 2');

insert into calendar(termid, schoolyear, week, firstday, starttype)
select t.termid, c.schoolyear, 18 as week, str_to_date(c.week18, '%c/%e/%Y') as firstday, c.starttype
from calendar_staging as c, term as t
where c.termname = t.termname
  and c.termname in ('Sem 1', 'Sem 2');

