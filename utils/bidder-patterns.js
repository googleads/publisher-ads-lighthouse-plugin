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

module.exports = [
  {
    label: 'Prebid JS',
    patterns: [
      `^http[s]?:\/\/([^.]*.)?prebid\.org\/.*`,
      '^http[s]?:\/\/acdn\.adnxs\.com/prebid/.*',
    ],
  },
  {
    label: 'Media.net',
    patterns: [
      '^http[s]?:\/\/contextual\.media\.net/bidexchange.*',
    ],
  },
  {
    label: 'AppNexus',
    patterns: [
      '^http[s]?:\/\/ib\.adnxs\.com\/jpt.*',
    ],
  },
  {
    label: 'Amazon',
    patterns: [
      '^http[s]?:\/\/([^.]*.)?aax\.amazon-adsystem\.com\/.*',
    ],
  },
  {
    label: 'AdTechus (AOL)',
    patterns: [
      '^http[s]?:\/\/([^.]*.)?adserver\.adtechus\.com\/.*',
    ],
  },
  {
    label: 'Aardvark',
    patterns: [
      '^http[s]?:\/\/thor\.rtk\.io\/.*',
    ],
  },
  {
    label: 'AdBlade',
    patterns: [
      '^http[s]?:\/\/rtb\.adblade\.com\/prebidjs\/bid.*',
    ],
  },
  {
    label: 'AdBund',
    patterns: [
      '^http[s]?:\/\/us-east-engine\.adbund\.xyz\/prebid\/ad\/get.*',
      '^http[s]?:\/\/us-west-engine\.adbund\.xyz\/prebid\/ad\/get.*',
    ],
  },
  {
    label: 'AdButler',
    patterns: [
      '^http[s]?:\/\/servedbyadbutler\.com\/adserve.*',
    ],
  },
  {
    label: 'Adequant',
    patterns: [
      '^http[s]?:\/\/rex\.adequant\.com\/rex\/c2s_prebid.*',
    ],
  },
  {
    label: 'AdForm',
    patterns: [
      '^http[s]?:\/\/adx\.adform\.net\/adx.*',
    ],
  },
  {
    label: 'AdMedia',
    patterns: [
      '^http[s]?:\/\/b\.admedia\.com\/banner\/prebid\/bidder.*',
    ],
  },
  {
    label: 'AdMixer',
    patterns: [
      '^http[s]?:\/\/inv-nets\.admixer\.net\/prebid\.aspx.*',
      '^http[s]?:\/\/inv-nets\.admixer\.net\/videoprebid\.aspx.*',
    ],
  },
  {
    label: 'AOL',
    patterns: [
      '^http[s]?:\/\/adserver-us\.adtech\.advertising\.com.*',
      '^http[s]?:\/\/adserver-eu\.adtech\.advertising\.com.*',
      '^http[s]?:\/\/adserver-as\.adtech\.advertising\.com.*',
      '^http[s]?:\/\/adserver\.adtech\.de\/pubapi\/.*',
    ],
  },
  {
    label: 'Facebook',
    patterns: [
      '^http[s]?:\/\/an\.facebook\.com\/v2\/placementbid\.json.*',
    ],
  },
  {
    label: 'Beachfront',
    patterns: [
      '^http[s]?:\/\/reachms\.bfmio\.com\/bid\.json?exchange_id=.*',
    ],
  },
  {
    label: 'Bidfluence',
    patterns: [
      '^http[s]?:\/\/cdn\.bidfluence\.com\/forge\.js.*',
    ],
  },
  {
    label: 'Brightcom',
    patterns: [
      '^http[s]?:\/\/hb\.iselephant\.com\/auc\/ortb.*',
    ],
  },
  {
    label: 'C1x',
    patterns: [
      '^http[s]?:\/\/ht-integration\.c1exchange\.com:9000\/ht.*',
    ],
  },
  {
    label: 'CentroBid',
    patterns: [
      '^http[s]?:\/\/t\.brand-server\.com\/hb.*',
    ],
  },
  {
    label: 'Conversant',
    patterns: [
      '^http[s]?:\/\/media\.msg\.dotomi\.com\/s2s\/.*',
    ],
  },
  {
    label: 'Criteo',
    patterns: [
      '^http[s]?:\/\/static\.criteo\.net\/js\/ld\/publishertag\.js.*',
      '^http[s]?:\/\/([^.]*.)?bidder\.criteo\.com\/cdb.*',
      '^http[s]?:\/\/([^.]*.)?rtax\.criteo\.com\/delivery/rta.*',
      '^http[s]?:\/\/([^.]*.)?rtax\.eu\.criteo\.com\/delivery/rta.*',
    ],
  },
  {
    label: 'Districtm',
    patterns: [
      '^http[s]?:\/\/prebid\.districtm\.ca\/lib\.js.*',
    ],
  },
  {
    label: 'E-Planning',
    patterns: [
      '^http[s]?:\/\/ads\.us\.e-planning\.net.*',
    ],
  },
  {
    label: 'Essens',
    patterns: [
      '^http[s]?:\/\/bid\.essrtb\.com\/bid\/prebid_call.*',
    ],
  },
  {
    label: 'FeatureForward',
    patterns: [
      '^http[s]?:\/\/prmbdr\.featureforward\.com\/newbidder\/.*',
    ],
  },
  {
    label: 'Fidelity',
    patterns: [
      '^http[s]?:\/\/x\.fidelity-media\.com.*',
    ],
  },
  {
    label: 'GetIntent',
    patterns: [
      '^http[s]?:\/\/px\.adhigh\.net\/rtb\/direct_banner.*',
      '^http[s]?:\/\/px\.adhigh\.net\/rtb\/direct_vast.*',
    ],
  },
  {
    label: 'GumGum',
    patterns: [
      '^http[s]?:\/\/g2\.gumgum\.com\/hbid\/imp.*',
    ],
  },
  {
    label: 'Hiromedia',
    patterns: [
      '^http[s]?:\/\/hb-rtb\.ktdpublishers\.com\/bid\/get.*',
    ],
  },
  {
    label: 'Imonomy',
    patterns: [
      '^http[s]?:\/\/b\.imonomy\.com\/openrtb\/hb\/.*',
    ],
  },
  {
    label: 'ImproveDigital',
    patterns: [
      '^http[s]?:\/\/ad\.360yield\.com\/hb.*',
    ],
  },
  {
    label: 'IndexExchange',
    patterns: [
      '^http[s]?:\/\/as\.casalemedia\.com\/cygnus.*',
      '^http[s]?:\/\/as-sec\.casalemedia\.com\/cygnus.*',
    ],
  },
  {
    label: 'InnerActive',
    patterns: [
      '^http[s]?:\/\/ad-tag\.inner-active\.mobi\/simpleM2M\/requestJsonAd.*',
    ],
  },
  {
    label: 'Innity',
    patterns: [
      '^http[s]?:\/\/as\.innity\.com\/synd\/.*',
    ],
  },
  {
    label: 'JCM',
    patterns: [
      '^http[s]?:\/\/media\.adfrontiers\.com\/pq.*',
    ],
  },
  {
    label: 'JustPremium',
    patterns: [
      '^http[s]?:\/\/pre\.ads\.justpremium\.com\/v\/.*',
    ],
  },
  {
    label: 'Kargo',
    patterns: [
      '^http[s]?:\/\/krk\.kargo\.com\/api\/v1\/bid.*',
    ],
  },
  {
    label: 'Komoona',
    patterns: [
      '^http[s]?:\/\/bidder\.komoona\.com\/v1\/GetSBids.*',
    ],
  },
  {
    label: 'KruxLink',
    patterns: [
      '^http[s]?:\/\/link\.krxd\.net\/hb.*',
    ],
  },
  {
    label: 'Kumma',
    patterns: [
      '^http[s]?:\/\/cdn\.kumma\.com\/pb_ortb\.js.*',
    ],
  },
  {
    label: 'Mantis',
    patterns: [
      '^http[s]?:\/\/mantodea\.mantisadnetwork\.com\/website\/prebid.*',
    ],
  },
  {
    label: 'MarsMedia',
    patterns: [
      '^http[s]?:\/\/bid306\.rtbsrv\.com:9306\/bidder.*',
    ],
  },
  {
    label: 'MemeGlobal',
    patterns: [
      '^http[s]?:\/\/stinger\.memeglobal\.com\/api\/v1\/services\/prebid.*',
    ],
  },
  {
    label: 'MobFox',
    patterns: [
      '^http[s]?:\/\/my\.mobfox\.com\/request\.php.*',
    ],
  },
  {
    label: 'NanoInteractive',
    patterns: [
      '^http[s]?:\/\/tmp\.audiencemanager\.de\/hb.*',
    ],
  },
  {
    label: 'OpenX',
    patterns: [
      '^http[s]?:\/\/([^.]*.)?d\.openx\.net\/w\/1\.0\/arj.*',
      '^http[s]?:\/\/([^.]*.)?servedbyopenx\.com\/.*',
    ],
  },
  {
    label: 'Piximedia',
    patterns: [
      '^http[s]?:\/\/static\.adserver\.pm\/prebid.*',
    ],
  },
  {
    label: 'Platformio',
    patterns: [
      '^http[s]?:\/\/piohbdisp\.hb\.adx1\.com.*',
    ],
  },
  {
    label: 'Pollux',
    patterns: [
      '^http[s]?:\/\/adn\.plxnt\.com\/prebid.*',
    ],
  },
  {
    label: 'PubGears',
    patterns: [
      '^http[s]?:\/\/c\.pubgears\.com\/tags.*',
    ],
  },
  {
    label: 'Pubmatic',
    patterns: [
      '^http[s]?:\/\/ads\.pubmatic\.com\/AdServer\/js\/gshowad\.js.*',
      '^http[s]?:\/\/([^.]*.)?gads.pubmatic\.com\/.*',
    ],
  },
  {
    label: 'Pulsepoint',
    patterns: [
      '^http[s]?:\/\/bid\.contextweb\.com\/header\/tag.*',
    ],
  },
  {
    label: 'Quantcast',
    patterns: [
      '^http[s]?:\/\/global\.qc\.rtb\.quantserve\.com:8080\/qchb.*',
    ],
  },
  {
    label: 'Rhythmone',
    patterns: [
      '^http[s]?:\/\/tag\.1rx\.io\/rmp\/.*',
    ],
  },
  {
    label: 'Roxot',
    patterns: [
      '^http[s]?:\/\/r\.rxthdr\.com.*',
    ],
  },
  {
    label: 'Rubicon',
    patterns: [
      '^http[s]?:\/\/([^.]*.)?(fastlane|optimized-by|anvil)\.rubiconproject\.com\/a\/api.*',
      '^http[s]?:\/\/fastlane-adv\.rubiconproject\.com\/v1\/auction\/video.*',
    ],
  },
  {
    label: 'Sekindo',
    patterns: [
      '^http[s]?:\/\/hb\.sekindo\.com\/live\/liveView\.php.*',
    ],
  },
  {
    label: 'ShareThrough',
    patterns: [
      '^http[s]?:\/\/btlr\.sharethrough\.com\/header-bid\/.*',
    ],
  },
  {
    label: 'Smart AdServer',
    patterns: [
      '^http[s]?:\/\/prg\.smartadserver\.com\/prebid.*',
    ],
  },
  {
    label: 'Sonobi',
    patterns: [
      '^http[s]?:\/\/apex\.go\.sonobi\.com\/trinity\.js.*',
    ],
  },
  {
    label: 'Sovrn',
    patterns: [
      '^http[s]?:\/\/ap\.lijit\.com\/rtb\/bid.*',
    ],
  },
  {
    label: 'SpringServe',
    patterns: [
      '^http[s]?:\/\/bidder\.springserve\.com\/display\/hbid.*',
    ],
  },
  {
    label: 'StickyAds',
    patterns: [
      '^http[s]?:\/\/cdn\.stickyadstv\.com\/mustang\/mustang\.min\.js.*',
      '^http[s]?:\/\/cdn\.stickyadstv\.com\/prime-time\/.*',
    ],
  },
  {
    label: 'TapSense3',
    patterns: [
      '^http[s]?:\/\/ads04\.tapsense\.com\/ads\/headerad.*',
    ],
  },
  {
    label: 'ThoughtLeadr',
    patterns: [
      '^http[s]?:\/\/a\.thoughtleadr\.com\/v4\/.*',
    ],
  },
  {
    label: 'TremorBid',
    patterns: [
      '^http[s]?:\/\/([^.]*.)?ads\.tremorhub\.com\/ad\/tag.*',
    ],
  },
  {
    label: 'Trion',
    patterns: [
      '^http[s]?:\/\/in-appadvertising\.com\/api\/bidRequest.*',
    ],
  },
  {
    label: 'TripleLift',
    patterns: [
      '^http[s]?:\/\/tlx\.3lift\.com\/header\/auction.*',
    ],
  },
  {
    label: 'TrustX',
    patterns: [
      '^http[s]?:\/\/sofia\.trustx\.org\/hb.*',
    ],
  },
  {
    label: 'UCFunnel',
    patterns: [
      '^http[s]?:\/\/agent\.aralego\.com\/header.*',
    ],
  },
  {
    label: 'Underdog Media',
    patterns: [
      '^http[s]?:\/\/udmserve\.net\/udm\/img\.fetch.*',
    ],
  },
  {
    label: 'UnRuly',
    patterns: [
      '^http[s]?:\/\/targeting\.unrulymedia\.com\/prebid.*',
    ],
  },
  {
    label: 'VertaMedia',
    patterns: [
      '^http[s]?:\/\/rtb\.vertamedia\.com\/hb\/.*',
    ],
  },
  {
    label: 'Vertoz',
    patterns: [
      '^http[s]?:\/\/hb\.vrtzads\.com\/vzhbidder\/bid.*',
    ],
  },
  {
    label: 'WideOrbig',
    patterns: [
      '^http[s]?:\/\/([^.]*.)?atemda\.com\/JSAdservingMP\.ashx.*',
    ],
  },
  {
    label: 'WideSpace',
    patterns: [
      '^http[s]?:\/\/engine\.widespace\.com\/map\/engine\/hb\/.*',
    ],
  },
  {
    label: 'YieldBot',
    patterns: [
      '^http[s]?:\/\/cdn\.yldbt\.com\/js\/yieldbot\.intent\.js.*',
    ],
  },
  {
    label: 'YieldMo',
    patterns: [
      '^http[s]?:\/\/ads\.yieldmo\.com\/exchange\/prebid.*',
    ],
  },
];
