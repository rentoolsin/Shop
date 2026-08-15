-- 0019_site_settings_coordinates.sql
-- Adds the shop's real geographic coordinates (latitude/longitude) to
-- `site_settings` (see 0008_site_settings.sql). These back the "how far
-- is the shop" distance check and the precise directions link on the
-- Home and Contact pages — coordinates are far more accurate for Maps
-- deep-links than a free-text address search.
--
-- Seeded with the shop's actual current location (converted from
-- 11°01'57.2"N 76°55'31.4"E), not a placeholder, same convention as the
-- rest of this table.

alter table site_settings
  add column if not exists latitude double precision not null default 11.032556,
  add column if not exists longitude double precision not null default 76.925389;

update site_settings
set latitude = 11.032556,
    longitude = 76.925389
where id = true;
