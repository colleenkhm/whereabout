-- Order for languages without a verified figure (1 = most spoken),
-- set from census main-language tables. Null sorts after ranked rows.
alter table country_languages add column if not exists display_rank smallint;
