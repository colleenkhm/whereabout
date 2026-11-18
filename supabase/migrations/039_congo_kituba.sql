-- Congo's constitution (2015, art. 4) names Kituba, not Kikongo, as a national language.
insert into languages (iso_code, name)
select 'ktu', 'Kituba'
where not exists (select 1 from languages where iso_code = 'ktu');

update country_languages
set language_id = (select id from languages where iso_code = 'ktu')
where country_id = (select id from countries where iso_code = 'CG')
  and language_id = (select id from languages where iso_code = 'kg')
  and not exists (
    select 1 from country_languages
    where country_id = (select id from countries where iso_code = 'CG')
      and language_id = (select id from languages where iso_code = 'ktu')
  );
