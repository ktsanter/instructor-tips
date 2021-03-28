#!/bin/bash

NETWORKID="$(docker network ls -fname=instructor-tips_backend -q)"
CONTAINERID="$(docker container ls -fname=db -q)"
[ -z "$NETWORKID" ] && { echo "Network not found" >&2 ; exit 1 ; }
[ -z "$CONTAINERID" ] && { echo "Container not found" >&2 ; exit 1 ; }

docker run -it --rm --mount type=bind,src=$(pwd)/sql,dst=/sql --network $NETWORKID mariadb mysql -h $CONTAINERID -uroot -p

