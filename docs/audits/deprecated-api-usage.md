# Avoid deprecated GPT APIs

## Overview

This audit ensures that deprecated Google Publisher Tag (GPT) APIs are not used.
Deprecated APIs are googletag methods or configuration options which are no longer maintained or documented. As these APIs 
may be partly or wholly removed from GPT, their use is discouraged and unpredictable behavior could come from their 
continued use.

## Recommendations

Observe the details of the audit to see which deprecated APIs are being used and remove their usage.
Many deprecated APIs will have a supported alternative which can be used instead.

Check [the official GPT release notes](https://developers.google.com/publisher-tag/release-notes) for more information on
deprecated APIs and suggested alternatives.

## More information

This audit checks console messages for the presence of any warnings or errors coming from GPT which are related to deprecated or 
discouraged APIs.