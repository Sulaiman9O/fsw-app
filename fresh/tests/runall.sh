#!/bin/bash
# run every feature test; record rc, time, any line with false / FAIL / non-empty errors
cd "$(dirname "$0")"; out=runall_$(date +%H%M).log; : > $out
for f in $(ls t*.js | sort -V); do
  s=$(date +%s); r=$(NODE_PATH=$(npm root -g) timeout 240 node $f 2>&1); rc=$?; e=$(( $(date +%s)-s ))
  echo "$r" > logs_$f.out
  bad=$(echo "$r" | grep -E '": false|^FAIL|TimeoutError|Error:|errors \[.+\]' | grep -v 'errors \[\]' | head -6)
  echo "== $f rc=$rc ${e}s $( [ -z "$bad" ] && [ $rc = 0 ] && echo OK || echo CHECK)" >> $out; [ -n "$bad" ] && echo "$bad" | cut -c1-250 >> $out
done
echo DONE >> $out
