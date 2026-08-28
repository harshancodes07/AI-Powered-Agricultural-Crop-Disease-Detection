-- Runs automatically the first time the postgres container's volume is created.
-- PostGIS gives us geographic types and spatial queries (nearby reports,
-- reports inside a region, disease hotspots).
CREATE EXTENSION IF NOT EXISTS postgis;
