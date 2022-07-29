// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

export default [
  {
    label: 'Prebid JS',
    patterns: [
      `^https?://([^.]*.)?prebid[.]org/.*`,
      '^https?://acdn[.]adnxs[.]com/prebid/.*',
    ],
  },
  {
    label: '33Across',
    patterns: [
      '^https?://ssc[.]33across.com/api/.*',
    ],
  },
  {
    label: 'AppNexus',
    patterns: [
      '^https?://ib[.]adnxs[.]com/.*',
    ],
  },
  {
    label: 'Amazon Ads',
    patterns: [
      '^https?://[a-z-_.]*[.]amazon-adsystem[.]com/.*bid.*',
    ],
  },
  {
    label: 'AdTechus (AOL)',
    patterns: [
      '^https?://([^.]*.)?adserver[.]adtechus[.]com/.*',
    ],
  },
  {
    label: 'Aardvark',
    patterns: [
      '^https?://thor[.]rtk[.]io/.*',
    ],
  },
  {
    label: 'AdBlade',
    patterns: [
      '^https?://rtb[.]adblade[.]com/prebidjs/bid.*',
    ],
  },
  {
    label: 'AdBund',
    patterns: [
      '^https?://us-east-engine[.]adbund[.]xyz/prebid/ad/get.*',
      '^https?://us-west-engine[.]adbund[.]xyz/prebid/ad/get.*',
    ],
  },
  {
    label: 'AdButler',
    patterns: [
      '^https?://servedbyadbutler[.]com/adserve.*',
    ],
  },
  {
    label: 'Adequant',
    patterns: [
      '^https?://rex[.]adequant[.]com/rex/c2s_prebid.*',
    ],
  },
  {
    label: 'AdForm',
    patterns: [
      '^https?://adx[.]adform[.]net/adx.*',
    ],
  },
  {
    label: 'AdMedia',
    patterns: [
      '^https?://b[.]admedia[.]com/banner/prebid/bidder.*',
    ],
  },
  {
    label: 'AdMixer',
    patterns: [
      '^https?://inv-nets[.]admixer[.]net/prebid[.]aspx.*',
      '^https?://inv-nets[.]admixer[.]net/videoprebid[.]aspx.*',
    ],
  },
  {
    label: 'AOL',
    patterns: [
      '^https?://adserver-us[.]adtech[.]advertising[.]com.*',
      '^https?://adserver-eu[.]adtech[.]advertising[.]com.*',
      '^https?://adserver-as[.]adtech[.]advertising[.]com.*',
      '^https?://adserver[.]adtech[.]de/pubapi/.*',
    ],
  },
  {
    label: 'Beachfront',
    patterns: [
      '^https?://reachms[.]bfmio[.]com/bid[.]json?exchange_id=.*',
    ],
  },
  {
    label: 'Bidfluence',
    patterns: [
      '^https?://cdn[.]bidfluence[.]com/forge[.]js.*',
    ],
  },
  {
    label: 'Brightcom',
    patterns: [
      '^https?://hb[.]iselephant[.]com/auc/ortb.*',
    ],
  },
  {
    label: 'C1x',
    patterns: [
      '^https?://ht-integration[.]c1exchange[.]com:9000/ht.*',
    ],
  },
  {
    label: 'CentroBid',
    patterns: [
      '^https?://t[.]brand-server[.]com/hb.*',
    ],
  },
  {
    label: 'Conversant',
    patterns: [
      '^https?://media[.]msg[.]dotomi[.]com/s2s/.*',
    ],
  },
  {
    label: 'Criteo',
    patterns: [
      '^https?://static[.]criteo[.]net/js/ld/publishertag[.]js.*',
      '^https?://([^.]*.)?bidder[.]criteo[.]com/cdb.*',
      '^https?://([^.]*.)?rtax[.]criteo[.]com/delivery/rta.*',
      '^https?://([^.]*.)?rtax[.]eu[.]criteo[.]com/delivery/rta.*',
    ],
  },
  {
    label: 'Datablocks',
    patterns: [
      '^https?://[a-z0-9_.-]*[.]dblks[.]net/.*',
    ],
  },
  {
    label: 'Districtm',
    patterns: [
      '^https?://prebid[.]districtm[.]ca/lib[.]js.*',
    ],
  },
  {
    label: 'E-Planning',
    patterns: [
      '^https?://ads[.]us[.]e-planning[.]net.*',
    ],
  },
  {
    label: 'Essens',
    patterns: [
      '^https?://bid[.]essrtb[.]com/bid/prebid_call.*',
    ],
  },
  {
    label: 'Facebook',
    patterns: [
      '^https?://an[.]facebook[.]com/v2/placementbid[.]json.*',
    ],
  },
  {
    label: 'FeatureForward',
    patterns: [
      '^https?://prmbdr[.]featureforward[.]com/newbidder/.*',
    ],
  },
  {
    label: 'Fidelity',
    patterns: [
      '^https?://x[.]fidelity-media[.]com.*',
    ],
  },
  {
    label: 'GetIntent',
    patterns: [
      '^https?://px[.]adhigh[.]net/rtb/direct_banner.*',
      '^https?://px[.]adhigh[.]net/rtb/direct_vast.*',
    ],
  },
  {
    label: 'GumGum',
    patterns: [
      '^https?://g2[.]gumgum[.]com/hbid/imp.*',
    ],
  },
  {
    label: 'Hiromedia',
    patterns: [
      '^https?://hb-rtb[.]ktdpublishers[.]com/bid/get.*',
    ],
  },
  {
    label: 'Imonomy',
    patterns: [
      '^https?://b[.]imonomy[.]com/openrtb/hb/.*',
    ],
  },
  {
    label: 'ImproveDigital',
    patterns: [
      '^https?://ad[.]360yield[.]com/hb.*',
    ],
  },
  {
    label: 'IndexExchange',
    patterns: [
      '^https?://as(-sec)?[.]casalemedia[.]com/(cygnus|headertag).*',
      '^https?://js(-sec)?[.]indexww[.]com/ht/.*',
    ],
  },
  {
    label: 'InnerActive',
    patterns: [
      '^https?://ad-tag[.]inner-active[.]mobi/simpleM2M/requestJsonAd.*',
    ],
  },
  {
    label: 'Innity',
    patterns: [
      '^https?://as[.]innity[.]com/synd/.*',
    ],
  },
  {
    label: 'JCM',
    patterns: [
      '^https?://media[.]adfrontiers[.]com/pq.*',
    ],
  },
  {
    label: 'JustPremium',
    patterns: [
      '^https?://pre[.]ads[.]justpremium[.]com/v/.*',
    ],
  },
  {
    label: 'Kargo',
    patterns: [
      '^https?://krk[.]kargo[.]com/api/v1/bid.*',
    ],
  },
  {
    label: 'Komoona',
    patterns: [
      '^https?://bidder[.]komoona[.]com/v1/GetSBids.*',
    ],
  },
  {
    label: 'KruxLink',
    patterns: [
      '^https?://link[.]krxd[.]net/hb.*',
    ],
  },
  {
    label: 'Kumma',
    patterns: [
      '^https?://cdn[.]kumma[.]com/pb_ortb[.]js.*',
    ],
  },
  {
    label: 'Mantis',
    patterns: [
      '^https?://mantodea[.]mantisadnetwork[.]com/website/prebid.*',
    ],
  },
  {
    label: 'MarsMedia',
    patterns: [
      '^https?://bid306[.]rtbsrv[.]com:9306/bidder.*',
    ],
  },
  {
    label: 'Media.net',
    patterns: [
      '^https?://contextual[.]media[.]net/bidexchange.*',
    ],
  },
  {
    label: 'MemeGlobal',
    patterns: [
      '^https?://stinger[.]memeglobal[.]com/api/v1/services/prebid.*',
    ],
  },
  {
    label: 'MobFox',
    patterns: [
      '^https?://my[.]mobfox[.]com/request[.]php.*',
    ],
  },
  {
    label: 'NanoInteractive',
    patterns: [
      '^https?://tmp[.]audiencemanager[.]de/hb.*',
    ],
  },
  {
    label: 'OpenX',
    patterns: [
      '^https?://([^.]*.)?d[.]openx[.]net/w/1[.]0/arj.*',
      '^https?://([^.]*.)?servedbyopenx[.]com/.*',
    ],
  },
  {
    label: 'Piximedia',
    patterns: [
      '^https?://static[.]adserver[.]pm/prebid.*',
    ],
  },
  {
    label: 'Platformio',
    patterns: [
      '^https?://piohbdisp[.]hb[.]adx1[.]com.*',
    ],
  },
  {
    label: 'Pollux',
    patterns: [
      '^https?://adn[.]plxnt[.]com/prebid.*',
    ],
  },
  {
    label: 'PubGears',
    patterns: [
      '^https?://c[.]pubgears[.]com/tags.*',
    ],
  },
  {
    label: 'Pubmatic',
    patterns: [
      '^https?://ads[.]pubmatic[.]com/AdServer/js/gshowad[.]js.*',
      '^https?://([^.]*.)?gads.pubmatic[.]com/.*',
      '^https?://hbopenbid.pubmatic[.]com/.*',
    ],
  },
  {
    label: 'Pulsepoint',
    patterns: [
      '^https?://bid[.]contextweb[.]com/header/tag.*',
    ],
  },
  {
    label: 'Quantcast',
    patterns: [
      '^https?://global[.]qc[.]rtb[.]quantserve[.]com:8080/qchb.*',
    ],
  },
  {
    label: 'Rhythmone',
    patterns: [
      '^https?://tag[.]1rx[.]io/rmp/.*',
    ],
  },
  {
    label: 'Roxot',
    patterns: [
      '^https?://r[.]rxthdr[.]com.*',
    ],
  },
  {
    label: 'Rubicon',
    patterns: [
      '^https?://([^.]*.)?(fastlane|optimized-by|anvil)[.]rubiconproject[.]com/a/api.*',
      '^https?://fastlane-adv[.]rubiconproject[.]com/v1/auction/video.*',
    ],
  },
  {
    label: 'Sekindo',
    patterns: [
      '^https?://hb[.]sekindo[.]com/live/liveView[.]php.*',
    ],
  },
  {
    label: 'ShareThrough',
    patterns: [
      '^https?://btlr[.]sharethrough[.]com/header-bid/.*',
    ],
  },
  {
    label: 'Smart AdServer',
    patterns: [
      '^https?://prg[.]smartadserver[.]com/prebid.*',
    ],
  },
  {
    label: 'Sonobi',
    patterns: [
      '^https?://apex[.]go[.]sonobi[.]com/trinity[.]js.*',
    ],
  },
  {
    label: 'Sovrn',
    patterns: [
      '^https?://ap[.]lijit[.]com/rtb/bid.*',
    ],
  },
  {
    label: 'SpringServe',
    patterns: [
      '^https?://bidder[.]springserve[.]com/display/hbid.*',
    ],
  },
  {
    label: 'StickyAds',
    patterns: [
      '^https?://cdn[.]stickyadstv[.]com/mustang/mustang[.]min[.]js.*',
      '^https?://cdn[.]stickyadstv[.]com/prime-time/.*',
    ],
  },
  {
    label: 'TapSense3',
    patterns: [
      '^https?://ads04[.]tapsense[.]com/ads/headerad.*',
    ],
  },
  {
    label: 'ThoughtLeadr',
    patterns: [
      '^https?://a[.]thoughtleadr[.]com/v4/.*',
    ],
  },
  {
    label: 'TremorBid',
    patterns: [
      '^https?://([^.]*.)?ads[.]tremorhub[.]com/ad/tag.*',
    ],
  },
  {
    label: 'Trion',
    patterns: [
      '^https?://in-appadvertising[.]com/api/bidRequest.*',
    ],
  },
  {
    label: 'TripleLift',
    patterns: [
      '^https?://tlx[.]3lift[.]com/header/auction.*',
    ],
  },
  {
    label: 'TrustX',
    patterns: [
      '^https?://sofia[.]trustx[.]org/hb.*',
    ],
  },
  {
    label: 'UCFunnel',
    patterns: [
      '^https?://agent[.]aralego[.]com/header.*',
    ],
  },
  {
    label: 'Underdog Media',
    patterns: [
      '^https?://udmserve[.]net/udm/img[.]fetch.*',
    ],
  },
  {
    label: 'UnRuly',
    patterns: [
      '^https?://targeting[.]unrulymedia[.]com/prebid.*',
    ],
  },
  {
    label: 'VertaMedia',
    patterns: [
      '^https?://rtb[.]vertamedia[.]com/hb/.*',
    ],
  },
  {
    label: 'Vertoz',
    patterns: [
      '^https?://hb[.]vrtzads[.]com/vzhbidder/bid.*',
    ],
  },
  {
    label: 'WideOrbig',
    patterns: [
      '^https?://([^.]*.)?atemda[.]com/JSAdservingMP[.]ashx.*',
    ],
  },
  {
    label: 'WideSpace',
    patterns: [
      '^https?://engine[.]widespace[.]com/map/engine/hb/.*',
    ],
  },
  {
    label: 'YieldBot',
    patterns: [
      '^https?://cdn[.]yldbt[.]com/js/yieldbot[.]intent[.]js.*',
    ],
  },
  {
    label: 'YieldMo',
    patterns: [
      '^https?://ads[.]yieldmo[.]com/exchange/prebid.*',
    ],
  },
];
