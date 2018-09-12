#!/bin/bash
# Usage: `./insights_to_csv.sh output-path.csv -r`
# Optional param `-r`-runs audits, otherwise will use existing reports
if [[ "$#" -ne 1 && "$#" -ne 2 ]]
then
    echo "At least 1 param needed, output-path."
    exit 1;
fi

runsPath=~/'DriveFileStream/Team Drives/AdSpeed/Insights   Lampad/runs';

tempOutPath='temp-out-'$(date +%F_%H-%M-%S)'.json';
echo '{ "outputs": [' > $tempOutPath
find "$runsPath" -mindepth 1 -maxdepth 1 -type d | while read line; do
  if [[ $2 == -r ]]; then
    $(node index.js -A "$line" --output json --quiet >> $tempOutPath) &&\
      $(echo -n , >> $tempOutPath)
  else
    reportPath=$(ls "$line"/*.report.json | head -1);
    $(cat "$reportPath" >> $tempOutPath) && $(echo -n , >> $tempOutPath)
  fi;
done
truncate -s-1 $tempOutPath
echo ]} >> $tempOutPath

headString='
  url,
  ad-blocking-tasks_score,
  ad-blocking-tasks_raw,
  ad-request-critical-path_score,
  ad-request-critical-path_raw,
  ad-request-from-page-start_score,
  ad-request-from-page-start_raw,
  ad-request-from-tag-load_score,
  ad-request-from-tag-load_raw,
  ads-in-viewport_score,
  ads-in-viewport_raw,
  async-ad-tags_score,
  async-ad-tags_raw,
  loads-gpt-over-https_score,
  loads-gpt-over-https_raw,
  serial-header-bidding_score,
  serial-header-bidding_raw,
  static-ad-tags_score,
  static-ad-tags_raw,
  tag-load-time_score,
  tag-load-time_raw,
  viewport-ad-density_score,
  viewport-ad-density_raw,
  full-width-slots_score,
  full-width-slots_raw,
  ad-top-of-viewport_score,
  ad-top-of-viewport_raw'

jqScript='
  .outputs[] as $o | $o.audits |
  .["ad-blocking-tasks"] as $abt |
  .["ad-request-critical-path"] as $arcp |
  .["ad-request-from-page-start"] as $arps |
  .["ad-request-from-tag-load"] as $artl |
  .["ads-in-viewport"] as $avp |
  .["async-ad-tags"] as $aat |
  .["loads-gpt-over-https"] as $lgoh |
  .["serial-header-bidding"] as $shb |
  .["static-ad-tags"] as $sat |
  .["tag-load-time"] as $tlt |
  .["viewport-ad-density"] as $vad |
  .["full-width-slots"] as $fws |
  .["ad-top-of-viewport"] as $atvp |
  [$o.finalUrl,
  $abt.score, $abt.rawValue,
  $arcp.score, $arcp.rawValue,
  $arps.score, $arps.rawValue,
  $artl.score, $artl.rawValue,
  $avp.score, $avp.rawValue,
  $aat.score, $aat.rawValue,
  $lgoh.score, $lgoh.rawValue,
  $shb.score, $shb.rawValue,
  $sat.score, $sat.rawValue,
  $tlt.score, $tlt.rawValue,
  $vad.score, $vad.rawValue,
  $fws.score, $fws.rawValue,
  $atvp.score, $atvp.rawValue] |
  @csv'

echo $headString > $1
eval "jq -r '$jqScript' $tempOutPath" >> $1
rm $tempOutPath

