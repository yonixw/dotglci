#!/usr/bin/env bash

git push local-gitlab-ci

# Kill all bg on Ctrl-C
trap '(jobs -p | xargs --no-run-if-empty kill -9); echo "Ctrl-C"; exit' INT 

start=`date`
echo "Start time: $start"

date_prefix() {
    # Current time:
    #DDATE=$(date +"%d.%m/%T.%N")
    #echo ${DDATE: 0:-5}

    # Delta time:
    stop=`date`
    duration=`date -ud@$(($(date -ud"$stop" +%s)-$(date -ud"$start" +%s))) +%T`
    echo "+$duration"
}

pipe_lines() {
    while IFS= read -r line; do
        echo "[$1] [`date_prefix`] $line"
    done
}

tail_until_nofile() {
    (tail -f "$1" | pipe_lines $(basename "$1")) &  # start tailing in the background
    BGPID=$!
    while [[ -f $1 ]]; do sleep 0.1; done # periodically check if target still exists
    echo "File $1 not exist, stop tail"
    kill $BGPID 2>/dev/null || : # kill tailing process, ignoring errors if already dead
}

find ./data/builds/ -name "*.log" |
    while IFS= read -r line; do
        echo "Found $line"
        tail_until_nofile $line  &
    done

echo "End time: $start"

