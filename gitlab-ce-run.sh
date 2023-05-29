#!/usr/bin/env bash

#git push local-gitlab-ci
#sudo tail -f ./data/builds/**/*.log -f ./data/builds/*.log
#sudo find ./data/builds/ -name "*.log" | sudo xargs tail -qf



#tail -f "$1" &  # start tailing in the background
#while [[ -f $1 ]]; do sleep 0.1; done # periodically check if target still exists
#kill $! 2>/dev/null || : # kill tailing process, ignoring errors if already dead

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
    BG_PID=$!
    while [[ -f $1 ]]; do sleep 0.1; done # periodically check if target still exists
    kill BG_PID 2>/dev/null || : # kill tailing process, ignoring errors if already dead
}




cat <<START | pipe_lines MyPrefix
1
2
3
1
2
3
1
2
3
1
2
3
1
2
3
1
2
3
1
2
3
START

echo $(date +"%d.%m %Z-%T.%N")
echo $(date +"%d.%m %Z-%T.%N")


tail_until_nofile ./1.txt