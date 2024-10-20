# Search for the city

    http://www.openstreetmap.org/search?query=Amsterdam

# In search results, find correct result and click:

    http://www.openstreetmap.org/relation/41485

Note that the tags shown mark it as: admin_level=8

per: http://wiki.openstreetmap.org/w/index.php?title=Tag:boundary%3Dadministrative&uselang=en-US#10_admin_level_values_for_specific_countries , Italy does not use admin_level=9, so:

# export an .osm for all data for a bounding box around rome:

https://mapzen.com/data/metro-extracts/ and search for Rome


(Download the "OSM XML"-formatted version).

# Prepare database

psql verbcoach (not -U verbcoach: do as postgres root user)

    CREATE EXTENSION postgis;
    -- Enable Topology
    CREATE EXTENSION postgis_topology;
    -- Enable PostGIS Advanced 3D 
    -- and other geoprocessing algorithms
    -- sfcgal not available with all distributions
    CREATE EXTENSION postgis_sfcgal;

# Import into postgres:

```
/opt/homebrew/Cellar/osm2pgsql/2.0.0/bin/osm2pgsql -U amsterdam -p amsterdam -d amsterdam ~/Downloads/amsterdam_netherlands.osm.pbf
```

## Flags

 -p prefix for created tables
 -s "(--slim) Store temporary data in the database. This greatly
                        reduces the RAM usage but is much slower. This
                        switch is required if you want to update with
                        --append later."

### Do a query:

```
SELECT name,ST_AsGeoJson(way) FROM amsterdam_polygon WHERE name = 'Vondelpark';
```

### Statistics

```
amsterdam=> SELECT admin_level, count(admin_level) FROM amsterdam_line GROUP by admin_level;
 admin_level | count
-------------+-------
 10          |   496
 4           |   108
 8           |   328
             |     0
(4 rows)
```


