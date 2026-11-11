import { PLAY_SPOT_LOCATIONS } from "./play-spots";
export interface PlayLocation {lat:number;lon:number;label:string;source?:string}
export const PLAY_LOCATIONS:Record<string,PlayLocation>={
  "gyeonggi-rice-dessert-2026": {
    "lat": 37.2669788,
    "lon": 126.997266,
    "label": "수원메쎄 일대",
    "source": "https://www.openstreetmap.org/way/837534254"
  },
  "paju-jangdanbean-2026": {
    "lat": 37.8922987,
    "lon": 126.7440013,
    "label": "임진각 일대",
    "source": "https://www.openstreetmap.org/way/499779122"
  },
  "taehwagang-garden": {
    "lat": 35.5497119,
    "lon": 129.2996875,
    "label": "태화강 국가정원 일대",
    "source": "https://www.openstreetmap.org/relation/11313014"
  },
  "daewangam-park": {
    "lat": 35.4923597,
    "lon": 129.4401777,
    "label": "대왕암공원 일대",
    "source": "https://www.openstreetmap.org/way/476518093"
  },
  "donggung-wolji": {
    "lat": 35.8347003,
    "lon": 129.2264375,
    "label": "경주 동궁과 월지 일대",
    "source": "https://www.openstreetmap.org/way/477417220"
  },
  "pohang-spacewalk": {
    "lat": 36.0651092,
    "lon": 129.3904401,
    "label": "스페이스워크 일대",
    "source": "https://www.openstreetmap.org/node/9664869462"
  },
  "huinnyeoul": {
    "lat": 35.0773961,
    "lon": 129.0456513,
    "label": "흰여울문화마을 일대",
    "source": "https://www.openstreetmap.org/node/5450264422"
  },
  "blueline-park": {
    "lat": 35.1581707,
    "lon": 129.1728278,
    "label": "미포정거장 기준",
    "source": "https://www.openstreetmap.org/way/1302530370"
  },
  "lotte-world": {
    "lat": 37.5110774,
    "lon": 127.0981905,
    "label": "롯데월드 어드벤처 일대",
    "source": "https://www.openstreetmap.org/node/4792473821"
  },
  "eworld": {
    "lat": 35.8521679,
    "lon": 128.5660265,
    "label": "이월드 E World 일대",
    "source": "https://www.openstreetmap.org/way/583267787"
  },
  "game-culture-2026": {
    "lat": 35.1657825586672,
    "lon": 129.135026643506,
    "label": "공식 안내 지도 기준"
  },
  "pohang-fireworks-2026": {
    "lat": 36.0530051077193,
    "lon": 129.377594275323,
    "label": "공식 안내 지도 기준"
  },
  "muan-yd-2026": {
    "lat": 34.81114285829472,
    "lon": 126.46281090185605,
    "label": "공식 안내 지도 기준"
  },
  "gstar-2026": {"lat":35.16884,"lon":129.13634,"label":"벡스코 제1전시장 일대","source":"https://www.openstreetmap.org/way/396366119"},
  "haeundae-lights-2026": {"lat":35.15929,"lon":129.15861,"label":"해운대해수욕장 일대","source":"https://www.openstreetmap.org/node/5004247384"},
  "christmas-busan-2026": {"lat":35.17122,"lon":129.12666,"label":"영화의전당 일대","source":"https://www.openstreetmap.org/node/5478364332"},
  "suseong-lights-2026": {"lat":35.83141,"lon":128.62322,"label":"수성못 일대","source":"https://www.openstreetmap.org/node/12223151437"},
  "geoje-flowers-2026": {"lat":34.85553,"lon":128.57976,"label":"거제시농업개발원 일대","source":"https://www.openstreetmap.org/way/902824608"},
  "goheung-yuja-2026": {"lat":34.57689,"lon":127.24695,"label":"고흥로 일대","source":"https://www.openstreetmap.org/way/1112992861"},
  "korean-sool-2026": {"lat":37.48376,"lon":127.03464,"label":"양재 일대","source":"https://www.openstreetmap.org/node/8808844621"},
  "seosan-chrysanthemum-2026": {"lat":36.6587,"lon":126.53855,"label":"서산고북농공단지 일대","source":"https://www.openstreetmap.org/way/1299946819"},
  "gwangbok-lights-2026": {"lat":35.09891,"lon":129.03483,"label":"광복로 일대","source":"https://www.openstreetmap.org/way/239481837"},
  "gwanghwamun-market-2026": {"lat":37.57278,"lon":126.97686,"label":"광화문광장 일대","source":"https://www.openstreetmap.org/relation/5672803"},
  "buncheon-santa-2026": {"lat":36.9326,"lon":129.05858,"label":"분천역 일대","source":"https://www.openstreetmap.org/way/486795527"},
  "homigot-sunrise-2027": {"lat":36.07635,"lon":129.56412,"label":"해맞이광장(면민회관) 일대","source":"https://www.openstreetmap.org/node/12146020776"},
  "coscomic-96-2026": {"lat":37.43409,"lon":127.02026,"label":"서울랜드 일대","source":"https://www.openstreetmap.org/way/383615126"},
  "agf-korea-2026": {"lat":37.66916,"lon":126.7456,"label":"한국국제전시장 1전시장 일대","source":"https://www.openstreetmap.org/way/264042512"},
  "comicworld-winter-2026": {"lat":37.66916,"lon":126.7456,"label":"한국국제전시장 1전시장 일대","source":"https://www.openstreetmap.org/way/264042512"},
  "jinan-kimchi-2026": {"lat":35.76041,"lon":127.43181,"label":"진무로 일대","source":"https://www.openstreetmap.org/way/1481188468"},
  "seoul-lantern-2026": {"lat":37.56888,"lon":126.97747,"label":"청계광장 옆 일대","source":"https://www.openstreetmap.org/node/4720111042"},
  "haeundae": {"lat":35.15929,"lon":129.15861,"label":"해운대해수욕장 일대","source":"https://www.openstreetmap.org/node/5004247384"},
  "busan-fireworks-2026": {"lat":35.15089,"lon":129.11678,"label":"광안리해수욕장 일대","source":"https://www.openstreetmap.org/way/107642460"},
  "seomyeon-lights-2026": {"lat":35.15732,"lon":129.05948,"label":"서면역 일대","source":"https://www.openstreetmap.org/node/5010843778"},
  "yuseong-christmas-2026": {"lat":36.36094,"lon":127.35919,"label":"유림공원 일대","source":"https://www.openstreetmap.org/way/49323607"},
  "beolgyo-cockle-2026": {"lat":34.87321,"lon":127.33891,"label":"벌교천 일대","source":"https://www.openstreetmap.org/way/53725055"},
  "pohang-steel-2026": {"lat":36.0498,"lon":129.3745,"label":"포항 동빈내항 일대(대략적 위치)"},
  "jangseungpo-fireworks-2026": {"lat":34.876,"lon":128.733,"label":"장승포항 일대(대략적 위치)"},
  "gunsan-fireworks-2026": {"lat":35.987,"lon":126.72,"label":"군산 내항 일대(대략적 위치)"},
  "ulsan-culture-expo-2026": {"lat":35.5518,"lon":129.1387,"label":"울산전시컨벤션센터 일대(대략적 위치)"},
  "busan-hotel": {"lat":35.1581,"lon":129.0617,"label":"서면 일대(대략적 위치)"}
};
Object.assign(PLAY_LOCATIONS, PLAY_SPOT_LOCATIONS);
