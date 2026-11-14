import { PostComments } from "@/components/PostComments";
import { PlayVisitGuide } from "@/components/PlayVisitGuide";
import { PostLocationMap } from "@/components/PostLocationMap";
import { BodyBlocks } from "@/components/BodyBlocks";
import { LinkedText } from "@/components/LinkedText";

import { PlayConditionsSummary } from "@/components/PlayConditionsSummary";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, Eye, Globe, Info, MapPin, Phone, Smartphone, Tag, TriangleAlert, UserRound } from "lucide-react";
import { CategoryBadge } from "@/components/CategoryBadge";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { ExternalCta } from "@/components/ExternalCta";
import { Gallery } from "@/components/Gallery";
import { getAppealStates } from "@/lib/post-appeals";
import { SurveyParticipation } from "@/components/SurveyParticipation";
import { YoutubeEmbed } from "@/components/YoutubeEmbed";
import { BadgeKit } from "@/components/BadgeKit";
import { FavoriteButton } from "@/components/FavoriteButton";
import { LikeButton } from "@/components/LikeButton";
import { getLikeCount, isLiked } from "@/lib/likes-store";
import { supabaseConfigured } from "@/lib/env";
import { isFavorite } from "@/lib/favorites-store";
import { OwnerActions } from "@/components/OwnerActions";
import { PostCard } from "@/components/PostCard";
import { ReportButton } from "@/components/ReportButton";
import { TrackEvent } from "@/components/TrackEvent";
import { getCurrentUser } from "@/lib/auth";
import { CATEGORY_MAP, LIMITS, PLATFORM_LABELS, withExclusiveRef } from "@/lib/constants";
import { OfficialBadge } from "@/components/OfficialBadge";
import { BenefitBadges } from "@/components/BenefitBadges";
import { CopyCodeButton } from "@/components/CopyCodeButton";
import { ctaLabel, platformText, secondaryLinks } from "@/lib/post-links";
import { effectiveStatus, isPostPublic } from "@/lib/queries";
import { store } from "@/lib/store";
import { formatCount, formatDate, getDomain, relativeTime, siteUrl } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

function parseId(v: string): number | null {
  return /^\d{1,12}$/.test(v) ? Number(v) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = parseId((await params).id);
  const post = id ? await store.getPost(id) : null;
  if (!post || !isPostPublic(post)) return { title: "홍보글을 찾을 수 없어요", robots: { index: false, follow: false } };

  // SNS 미리보기는 SVG 를 지원하지 않으므로 업로드 이미지(webp 등)가 있을 때만 사용하고, 없으면 사이트 기본 OG 이미지를 씁니다.
  const img = post.primaryImageUrl && !post.primaryImageUrl.endsWith(".svg") ? post.primaryImageUrl : null;
  const ogImage = img
    ? { url: img, width: 1280, height: 720, alt: post.title }
    : { url: "/og.png", width: 1200, height: 630, alt: "더홍보" };
  return {
    title: post.title,
    description: post.shortDescription,
    alternates: { canonical: `/post/${post.id}` },
    openGraph: {
      type: "article",
      title: `${post.title} | 더홍보`,
      description: post.shortDescription,
      url: `/post/${post.id}`,
      images: [ogImage],
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.shortDescription, images: [ogImage.url] },
  };
}

export default async function PostDetailPage({ params }: Props) {
  const id = parseId((await params).id);
  if (!id) notFound();
  const [user, post] = await Promise.all([getCurrentUser(), store.getPost(id)]);
  if (!post || post.status === "deleted") notFound();

  const isOwner = !!user && post.authorId === user.id;
  const canManage = isOwner || !!user?.isAdmin;
  const [favorited, liked] = user
    ? await Promise.all([
        isFavorite(user.id, post.id).catch(() => false),
        isLiked(user.id, post.id).catch(() => false),
      ])
    : [false, false];
  const likeCount = supabaseConfigured() ? (post.likeCount ?? 0) : await getLikeCount(post.id);
  const publicNow = isPostPublic(post);
  if (!publicNow && !canManage) notFound();
  const appealState = isOwner && ["hidden", "blocked"].includes(post.status) ? (await getAppealStates([post.id]))[post.id] : undefined;
  const secondStage = ["pdf_requested", "rejected"].includes(appealState ?? "");

  const cat = CATEGORY_MAP[post.category];
  const status = effectiveStatus(post);
  const [related, author] = await Promise.all([
    store.listPosts({ publicOnly: true, category: post.category, excludeIds: [post.id], sort: "popular", popularMode: "curated", pageSize: 6 }),
    post.authorId && !post.isSeed ? store.getProfile(post.authorId) : Promise.resolve(null),
  ]);

  const images = [post.primaryImageUrl || cat.defaultImage, ...post.images];
  const label = ctaLabel(post);
  const others = secondaryLinks(post);
  const plat = platformText(post);
  const usage = post.extra.usageType ? PLATFORM_LABELS[post.extra.usageType] : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "더홍보", item: siteUrl() },
      { "@type": "ListItem", position: 2, name: cat.name, item: `${siteUrl()}/category/${cat.slug}` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${siteUrl()}/post/${post.id}` },
    ],
  };

  const rows: Array<{ icon: React.ReactNode; k: string; v: React.ReactNode }> = [];
  if (plat) rows.push({ icon: <Smartphone size={15} />, k: post.category === "content" ? "플랫폼" : "지원 환경", v: plat });
  if (usage) rows.push({ icon: <Info size={15} />, k: "이용 방식", v: usage });
  if (post.extra.period) rows.push({ icon: <CalendarClock size={15} />, k: "모집/행사 기간", v: post.extra.period });
  if (post.address) rows.push({ icon: <MapPin size={15} />, k: "주소", v: [post.address, post.extra.addressDetail].filter(Boolean).join(" ") });
  if (post.category === "products" && post.extra.deliveryMethod) rows.push({ icon: <Info size={15} />, k: "배송방법", v: post.extra.deliveryMethod });
  if (post.category === "products" && post.extra.deliveryMethod && post.extra.deliveryPeriod) rows.push({ icon: <CalendarClock size={15} />, k: "평균 배송기간", v: post.extra.deliveryPeriod });
  if (post.category === "products" && post.extra.saleMethod) rows.push({ icon: <Info size={15} />, k: "판매방법", v: post.extra.saleMethod });
  if (post.contact) rows.push({ icon: <Phone size={15} />, k: "연락 방법", v: post.contact });
  if (author) rows.push({ icon: <UserRound size={15} />, k: "작성자", v: author.nickname });

  return (
    <div className="wrap pb-28 pt-5 sm:pt-7 lg:pb-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      {publicNow && <TrackEvent type="post_view" postId={post.id} />}

      <nav aria-label="현재 위치" className="mb-4 flex items-center gap-1.5 text-[13px] text-muted">
        <Link href="/" className="hover:text-brand">홈</Link>
        <span aria-hidden>/</span>
        <Link href={`/category/${cat.slug}`} className="hover:text-brand">{cat.name}</Link>
      </nav>

      {!publicNow && (
        <div role="status" className="mb-5 flex items-start gap-2.5 rounded-xl border border-[#f5d9a8] bg-[#fff8ea] px-4 py-3 text-[14px] text-[#8a5a00]">
          <TriangleAlert size={18} className="mt-0.5 shrink-0" aria-hidden />
          <p>
            {status === "expired"
              ? "노출 기간이 지나 목록에서 내려간 글이에요. '내 홍보'에서 다시 홍보하기를 누르면 다시 노출돼요."
              : "현재 숨김 처리된 글이에요. 작성자와 관리자에게만 보입니다."}
            {isOwner && (post.status === "hidden" || post.status === "blocked") && <Link href={secondStage ? `/restoration?post=${post.id}` : `/appeals/${post.id}`} className="btn btn-outline ml-3">{secondStage ? "복원 신청하기" : "이의제기 · 처리 상태"}</Link>}
          </p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_370px] lg:gap-8">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <Gallery images={images} title={post.title} />
          {post.extra.youtubeId && (
            <div className="mt-4">
              <YoutubeEmbed id={post.extra.youtubeId} title={post.title} />
            </div>
          )}
        </div>

        <aside className="lg:col-start-2 lg:row-span-2 lg:row-start-1" aria-label="홍보 정보">
          <div className={post.address ? "rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6" : "rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6 lg:sticky lg:top-[72px]"}>
            <div className="flex flex-wrap items-center gap-1.5">
              <CategoryBadge slug={post.category} className="!text-[12.5px] !px-2 !py-1" />
              {post.region && (
                <span className="inline-flex items-center gap-1 rounded-md bg-soft px-2 py-1 text-[12.5px] font-bold text-ink-2">
                  <MapPin size={12} aria-hidden /> {post.region}
                </span>
              )}
            </div>
            {(post.extra.official || (post.extra.benefits?.length ?? 0) > 0) && (
              <div className="mt-3 flex flex-wrap items-center gap-1">
                <OfficialBadge value={post.extra.official} />
                <BenefitBadges values={post.extra.benefits} />
              </div>
            )}
            <h1 className="mt-3 text-[22px] font-black leading-[1.3] tracking-[-0.04em] sm:text-[24px]">{post.title}</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{post.shortDescription}</p>

            {post.tags.includes("놀러가자") && <><PlayConditionsSummary conditions={post.extra.play} price={post.price}/><PlayVisitGuide conditions={post.extra.play} address={post.address} region={post.region} title={post.title}/></>}
            {post.extra.exclusive && (
              <div className="mt-4 overflow-hidden rounded-xl bg-gradient-to-br from-[#ffe49a] via-[#f0b429] to-[#c9830a] p-[2px] shadow-[0_6px_20px_-6px_rgba(201,131,10,0.6)]">
              <div className="rounded-[10px] bg-gradient-to-b from-[#fffdf6] to-[#fff4d6] p-3.5">
                <p className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-[#a86a0b] via-[#e0a31a] to-[#a86a0b] px-2 py-0.5 text-[12px] font-extrabold text-white">★ 더홍보 전용 이벤트</p>
                <p className="mt-1 text-[15px] font-extrabold leading-snug text-ink">{post.extra.exclusive.reward}</p>
                {post.extra.exclusive.how && (
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">
                    <b>받는 방법</b> · {post.extra.exclusive.how}
                  </p>
                )}
                {post.extra.exclusive.method === "code" && post.extra.exclusive.code && <CopyCodeButton code={post.extra.exclusive.code} />}
                {post.extra.exclusive.method === "survey" && publicNow && (
                  <a href="#hongbo-survey" className="btn btn-primary mt-3 w-full">더홍보 설문 참여하기</a>
                )}
                {post.extra.exclusive.method === "link" && post.extra.exclusive.url && publicNow && (
                  <div className="mt-2.5">
                    <ExternalCta href={withExclusiveRef(post.extra.exclusive.url)} postId={post.id} label="외부 이벤트 링크 열기" />
                  </div>
                )}
              </div>
              </div>
            )}

            {post.price && (
              <p className="mt-4 text-[26px] font-black tracking-[-0.03em] text-brand">{post.price}</p>
            )}

            {rows.length > 0 && (
              <dl className="mt-4 space-y-2.5 border-t border-line pt-4 text-[14px]">
                {rows.map((r) => (
                  <div key={r.k} className="flex gap-3">
                    <dt className="flex w-[104px] shrink-0 items-center gap-1.5 text-muted">
                      <span aria-hidden className="text-faint">{r.icon}</span>
                      {r.k}
                    </dt>
                    <dd className="min-w-0 flex-1 break-words font-medium text-ink-2">{r.v}</dd>
                  </div>
                ))}
              </dl>
            )}

            {publicNow && post.extra.couponCode && (
              <section aria-label="쿠폰 코드" className="mt-5 min-w-0 rounded-xl border border-brand-line bg-brand-soft p-3">
                <h2 className="text-sm font-bold">쿠폰 코드</h2>
                <CopyCodeButton code={post.extra.couponCode} />
                {post.extra.couponNote && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted">{post.extra.couponNote}</p>}
              </section>
            )}
            <div className="mt-5 hidden space-y-2 lg:block">
              {publicNow && post.externalUrl && <ExternalCta href={post.externalUrl} postId={post.id} label={label} />}
              {publicNow &&
                others.map((l) => (
                  <ExternalCta key={l.url} href={l.url} postId={post.id} label={l.label} variant="outline" />
                ))}
              {post.externalUrl && (
                <p className="flex items-center justify-center gap-1 pt-1 text-xs text-faint">
                  <Globe size={12} aria-hidden /> {getDomain(post.externalUrl)} 으로 이동해요
                </p>
              )}
            </div>
            <div className="mt-4 space-y-2 lg:hidden">
              {publicNow &&
                others.map((l) => (
                  <ExternalCta key={l.url} href={l.url} postId={post.id} label={l.label} variant="outline" />
                ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4 text-[13px] text-muted">
              <span className="flex items-center gap-2.5">
                <time dateTime={post.publishedAt} title={formatDate(post.publishedAt)}>
                  {formatDate(post.publishedAt)} · {relativeTime(post.publishedAt)}
                </time>
                {post.viewCount >= LIMITS.showViewsFrom && (
                  <span className="inline-flex items-center gap-1">
                    <Eye size={14} aria-hidden /> {formatCount(post.viewCount)}
                  </span>
                )}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-start gap-x-4 gap-y-2 [&_a]:whitespace-nowrap [&_button]:whitespace-nowrap">
              <CopyLinkButton path={`/post/${post.id}`} />
              <FavoriteButton postId={post.id} initial={favorited} loggedIn={!!user} />
              <LikeButton postId={post.id} initial={liked} initialCount={likeCount} loggedIn={!!user} />
              <ReportButton postId={post.id} />
            </div>

            {canManage && (
              <div className="mt-4 rounded-xl bg-soft p-3">
                <p className="mb-2 text-xs font-semibold text-muted">{isOwner ? "내가 쓴 글" : "관리자 메뉴"}</p>
                <OwnerActions postId={post.id} canRenew={isOwner} size="sm" redirectTo={isOwner ? "/mypage" : "/admin/posts"} />
                {isOwner && publicNow && <BadgeKit postId={post.id} origin={siteUrl()} />}
                {post.extra.exclusive?.method === "survey" && (
                  <Link href={`/post/${post.id}/survey-results`} className="mt-2 inline-flex items-center rounded-lg border border-[#e6c77a] bg-white px-3 py-2 text-[13px] font-bold text-[#8a6105] hover:bg-[#fff7e0]">
                    설문 결과 확인 (작성자 전용)
                  </Link>
                )}
              </div>
            )}
          </div>
          <PostLocationMap address={post.address} detail={post.extra.addressDetail} />
        </aside>

        <div className="min-w-0 lg:col-start-1 lg:row-start-2">
          <section aria-labelledby="desc-title" className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-7">
            <h2 id="desc-title" className="mb-4 text-lg font-extrabold tracking-[-0.03em]">
              상세 설명
            </h2>
            {post.extra.bodyFormat !== "rich" && <div className="prose-body"><LinkedText text={post.description} /></div>}
            <BodyBlocks blocks={post.extra.bodyBlocks} />
            {!!post.extra.notes?.length && <section aria-label="추가 안내" className="mt-6 space-y-3">
              {post.extra.notes.map((note, i) => <section key={i} className="min-w-0 rounded-xl border border-line bg-soft/50 p-4 sm:p-5">
                <h3 className="break-words text-base font-bold">{note.title}</h3>
                <p className="mt-2 whitespace-pre-wrap break-words text-[14.5px] leading-relaxed text-ink-2">{note.body}</p>
              </section>)}
            </section>}

            {post.tags.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
                {post.tags.map((t) => (
                  <li key={t}>
                    <Link
                      href={`/search?q=${encodeURIComponent(t)}`}
                      className="inline-flex items-center gap-1 rounded-full bg-soft px-3 py-1.5 text-[13px] font-medium text-ink-2 hover:bg-brand-soft hover:text-brand-dark"
                    >
                      <Tag size={12} aria-hidden />
                      {t}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {publicNow && post.extra.exclusive?.method === "survey" && (post.extra.exclusive.survey?.length ?? 0) > 0 && (
        <SurveyParticipation postId={post.id} questions={post.extra.exclusive.survey!} payout={post.extra.exclusive.payout} />
      )}

      {publicNow && <PostComments postId={post.id} />}

      {related.items.length > 0 && (
        <section aria-label="같은 카테고리의 다른 홍보" className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[19px] font-extrabold tracking-[-0.04em]">{cat.name}의 다른 홍보</h2>
            <Link href={`/category/${cat.slug}`} className="text-[13.5px] font-medium text-muted hover:text-brand">
              더보기
            </Link>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {related.items.map((p) => (
              <li key={p.id}>
                <PostCard post={p} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {publicNow && post.externalUrl && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 p-3 backdrop-blur lg:hidden">
          <div className="mx-auto max-w-[520px]">
            <ExternalCta href={post.externalUrl} postId={post.id} label={label} />
          </div>
        </div>
      )}
    </div>
  );
}
