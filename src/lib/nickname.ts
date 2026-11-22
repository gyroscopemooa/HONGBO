const RESERVED_NICKNAME_TERMS = [
  "admin",
  "administrator",
  "운영자",
  "운영진",
  "운영팀",
  "운영부",
  "관리자",
  "관리팀",
  "관리부",
  "moderator",
  "staff",
  "operator",
];

/** Normalizes permitted separators so `a d-m_i n` cannot impersonate staff. */
export function isReservedNickname(nickname: string) {
  const compact = nickname.toLowerCase().replace(/[\s_-]/g, "");
  return RESERVED_NICKNAME_TERMS.some((term) => compact.includes(term));
}
