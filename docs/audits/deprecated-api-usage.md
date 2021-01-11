# Avoid using deprecated GPT APIs

## Overview

This audit checks for the presence of warning and error messages coming from GPT which relate to deprecated API usage.
Deprecated APIs are APIs which are no longer maintained and may be removed. As a result, their use is discouraged, as
unpredictable behavior could come from their continued use.

## Recommendations

Observe the details of the audit to see which APIs in particular are still in use on the page and try to remove their usage.
Many deprecated APIs will have a supported alternative which can be used instead.

## More information

Check [the official GPT release notes](https://developers.google.com/publisher-tag/release-notes) for more information on
deprecated APIs and suggested alternatives.
