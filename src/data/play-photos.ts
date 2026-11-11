import { PLAY_LATEST_PHOTOS } from "./play-latest-photos";
import { PLAY_TOURISM_PHOTOS } from "./play-tourism-photos";
import { PLAY_FESTIVAL_PHOTOS } from "./play-festival-photos";
export type PlayPhoto = { src: string; alt: string; author: string; title: string; captured: string; source: string; width: number; height: number; license?: string; licenseUrl?: string; label?: string; caption?: string; fit?: "contain"; creditNote?: string };
const sa4 = { license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" };
const sa3 = { license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/" };
const cc0 = { license: "CC0 1.0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/" };
export const PLAY_PHOTOS: Record<string, PlayPhoto> = {
  ...PLAY_FESTIVAL_PHOTOS,
  ...PLAY_LATEST_PHOTOS,
  ...PLAY_TOURISM_PHOTOS,
  "seoul-lantern-2026": {
    ...sa4, width: 1280, height: 960, src: "/play/seoul-lantern.jpg", alt: "청계천 물 위에 빛나는 서울빛초롱축제의 푸른 조형물",
    author: "Ethan Doyle White", title: "Blue Lanterns at the 2019 Seoul Lantern Festival", captured: "2019-11-06",
    source: "https://commons.wikimedia.org/wiki/File:Blue_Lanterns_at_the_2019_Seoul_Lantern_Festival.jpg",
    caption: "2019 서울빛초롱축제 자료사진 · 2026년 전시 구성과 다를 수 있습니다.",
  },
  haeundae: {
    ...sa4, width: 1280, height: 960,
    src: "/play/haeundae.jpg", alt: "해운대 바다와 해변을 따라 이어진 부산의 건물들",
    author: "Andrewssi2", title: "Hauendae", captured: "2024-01-01",
    source: "https://commons.wikimedia.org/wiki/File:Hauendae.jpg",
  },
  "blueline-park": {
    ...sa4, width: 1280, height: 960,
    src: "/play/sky-capsule.jpg", alt: "해운대 바닷가 고가 선로 위를 달리는 노란 스카이캡슐",
    author: "VN.NguyenDucDuy", title: "Sky Capsule train at Haeundae Blueline Park, Busan", captured: "2026-04-29",
    source: "https://commons.wikimedia.org/wiki/File:Sky_Capsule_train_at_Haeundae_Blueline_Park,_Busan.jpg",
  },
  huinnyeoul: {
    ...cc0, width: 1280, height: 960, src: "/play/huinnyeoul.jpg", alt: "흰여울문화마을 해안 골목과 바다 전망",
    author: "Choi2451", title: "Huinnyeoul culture village, Busan on October 25th, 2019", captured: "2019-10-25",
    source: "https://commons.wikimedia.org/wiki/File:Huinnyeoul_culture_village,_Busan_on_October_25th,_2019.jpg",
  },
  "lotte-world": {
    ...sa3, width: 1280, height: 960, src: "/play/lotte-world.jpg", alt: "서울 롯데월드 매직캐슬과 모노레일",
    author: "Ha98574", title: "Lotte World by Mins", captured: "2010-05-27",
    source: "https://commons.wikimedia.org/wiki/File:Lotte_World_by_Mins.jpg",
  },
  eworld: {
    ...sa3, width: 1280, height: 768, src: "/play/eworld.jpg", alt: "대구 이월드 케이블카와 놀이시설 전경",
    author: "Choi2451", title: "E WORLD in Daegu on April 5th 2013", captured: "2013-04-05",
    source: "https://commons.wikimedia.org/wiki/File:E_WORLD_in_Daegu_on_April_5th_2013.jpg",
  },
  "busan-hotel": {
    ...cc0, width: 1411, height: 1058, src: "/play/busan-hotel.jpg", alt: "부산 서면 롯데백화점과 뒤편 롯데호텔 부산 건물",
    author: "가매인", title: "서면 롯데백화점", captured: "2025-06-18",
    source: "https://commons.wikimedia.org/wiki/File:서면_롯데백화점.jpg",
    caption: "롯데호텔 부산·서면 롯데백화점 외관 자료사진 · 객실 사진이 아닙니다.",
  },
  "busan-fireworks-2026": {
    ...sa4, width: 1280, height: 640, src: "/play/busan-fireworks.jpg", alt: "광안대교와 바다 위로 펼쳐지는 부산불꽃축제 불꽃",
    author: "Busan Metropolitan city", title: "The Busan International Fireworks Festival", captured: "2018-08-07",
    source: "https://commons.wikimedia.org/wiki/File:The_Busan_International_Fireworks_Festival.jpg",
    caption: "과거 부산불꽃축제 자료사진 · 2026년 행사 현장 사진이 아닙니다.",
  },
};
export function playPhoto(slug: string): PlayPhoto | undefined { return PLAY_PHOTOS[slug]; }
