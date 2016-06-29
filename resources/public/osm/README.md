# Search for the city

    http://www.openstreetmap.org/search?query=Rome

# In search results, find correct result and click:

    http://www.openstreetmap.org/relation/41485

Note that the tags shown mark it as: admin_level=8

per: http://wiki.openstreetmap.org/w/index.php?title=Tag:boundary%3Dadministrative&uselang=en-US#10_admin_level_values_for_specific_countries , Italy does not use admin_level=9, so:

# export an .osm for all data for a bounding box around rome:

https://mapzen.com/data/metro-extracts/ and search for Rome


(Download the "OSM XML"-formatted version).

# Import into postgres:

    osm2pgsql -p rome -s -U verbcoach -d verbcoach -H localhost ~/Downloads/rome_italy.osm

# Do a query:

    SELECT name,ST_AsGeoJson(way) FROM rome_polygon WHERE name='Sallustiano';
