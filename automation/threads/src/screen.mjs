// Conservative text/metadata screening. Uncertain media and personal data need review.
export function needsThreadsReview(post) {
  if (post.contact || post.address || post.primary_image_url || post.images?.length) return true;
  const text = JSON.stringify([post.title, post.short_description, post.description, post.extra, post.external_url, post.tags]).normalize('NFKC');
  return /[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?82[ -]?|0)\d{1,2}[ .-]?\d{3,4}[ .-]?\d{4}|\d{6}\s*[-–]\s*[1-8]\d{6}|계좌|주민등록|여권|카드번호|비밀번호|진단|병력|성생활|정치성향|자택|집주소|상담내역|환자|고객명|명단|sk-[a-z0-9]{12,}|AKIA[a-z0-9]{12,}|[?&](?:token|key|secret|password|email|phone)=/i.test(text);
}
