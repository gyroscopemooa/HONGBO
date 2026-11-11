export const PLAY_PHOTOS = {
  haeundae: {
    src: "/play/haeundae.jpg", alt: "해운대 바다와 해변을 따라 이어진 부산의 건물들",
    author: "Andrewssi2", title: "Hauendae", captured: "2024-01-01",
    source: "https://commons.wikimedia.org/wiki/File:Hauendae.jpg",
  },
  "blueline-park": {
    src: "/play/sky-capsule.jpg", alt: "해운대 바닷가 고가 선로 위를 달리는 노란 스카이캡슐",
    author: "VN.NguyenDucDuy", title: "Sky Capsule train at Haeundae Blueline Park, Busan", captured: "2026-04-29",
    source: "https://commons.wikimedia.org/wiki/File:Sky_Capsule_train_at_Haeundae_Blueline_Park,_Busan.jpg",
  },
} as const;
export const PLAY_PHOTO_LICENSE = "https://creativecommons.org/licenses/by-sa/4.0/";
export function playPhoto(slug: string) { return PLAY_PHOTOS[slug as keyof typeof PLAY_PHOTOS]; }
