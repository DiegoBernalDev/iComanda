-- HU-16-extra: Logo del restaurante
alter table restaurants
  add column if not exists logo_url text;
