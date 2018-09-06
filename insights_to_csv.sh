#!/bin/bash
# Usage: `./insights_to_csv.sh {URL} {File to add or append to}`
if [ "$#" -ne 2 ]; then
    echo "2 params needed, url and filename."
    exit 1;
fi
fields=(SCORE RAW_VAL);
vals=( $(node index.js $1 --quiet --output json |
  jq -r '.audits[] | "\(.id)\n\(.score)\n\(.rawValue)"' ) );

headString='url';
valString=$1;
valOffset=$((${#fields[@]}+1));
vIndex=0;
for val in "${vals[@]}";
do
  if [ $((vIndex%valOffset)) -eq 0 ];
 then
   for field in "${fields[@]}";
   do
     headString="$headString,$val $field";
   done;
 else
   valString=$valString,$val;
 fi;
 vIndex=$(($vIndex+1));
done;

if [ ! -f $2 ]; then
    echo $headString > $2;
fi
echo $valString >> $2;

