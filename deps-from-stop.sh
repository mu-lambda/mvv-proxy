#! /bin/bash
list=$(cat data/stops.csv | grep ';Planegg' | cut -f 4 -d \;)
#list='de:09162:1626'

for l in $list; do
    url="https://www.mvv-muenchen.de/?eID=departuresFinder&action=get_departures&requested_timestamp=1735668770&lines="
    curl --get --silent --data-urlencode "stop_id=$l" $url |\
        jq --raw-output '.departures[] | "   { mvvApiId: \"\(.line.stateless)\", id: \"\(.line.number)\", name: \"\(.line.number)\", destination: \"\(.line.direction)\",  },"'
done

