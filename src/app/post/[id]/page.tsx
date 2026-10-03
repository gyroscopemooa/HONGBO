import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, Eye, Globe, Info, MapPin, Phone, Smartphone, Tag, TriangleAlert, UserRound } from "lucide-react";
import { CategoryBadge } from "@/components/CategoryBadge";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { ExternalCta } from "@/components/ExternalCta";
import { Gallery } from "@/components/Gallery";
import { OwnerActions } from "@/components/OwnerActions";
import { PostCard } from "@/components/PostCard";
import { ReportButton } from "@/components/ReportButton";
import { TrackEvent } from "@/components/TrackEvent";
import { getCurrentUser } from "@/lib/auth";
import { CATEGORY_MAP, LIMITS, PLATFORM_LABELS } from "@/lib/constants";
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
  const publicNow = isPostPublic(post);
  if (!publicNow && !canManage) notFound();

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
  if (post.address) rows.push({ icon: <MapPin size={15} />, k: "주소", v: post.address });
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
          </p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_370px] lg:gap-8">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <Gallery images={images} title={post.title} />
        </div>

        <aside className="lg:col-start-2 lg:row-span-2 lg:row-start-1" aria-label="홍보 정보">
          <div className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6 lg:sticky lg:top-[72px]">
            <div className="flex flex-wrap items-center gap-1.5">
              <CategoryBadge slug={post.category} className="!text-[12.5px] !px-2 !py-1" />
              {post.region && (
                <span className="inline-flex items-center gap-1 rounded-md bg-soft px-2 py-1 text-[12.5px] font-bold text-ink-2">
                  <MapPin size={12} aria-hidden /> {post.region}
                </span>
              )}
            </div>
            <h1 className="mt-3 text-[22px] font-black leading-[1.3] tracking-[-0.04em] sm:text-[24px]">{post.title}</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{post.shortDescription}</p>

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

            <div className="mt-5 hidden space-y-2 lg:block">
              {publicNow && <ExternalCta href={post.externalUrl} postId={post.id} label={label} />}
              {publicNow &&
                others.map((l) => (
                  <ExternalCta key={l.url} href={l.url} postId={post.id} label={l.label} variant="outline" />
                ))}
              <p className="flex items-center justify-center gap-1 pt-1 text-xs text-faint">
                <Globe size={12} aria-hidden /> {getDomain(post.externalUrl)} 으로 이동해요
              </p>
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
            <div className="mt-3 flex items-center gap-4">
              <CopyLinkButton path={`/post/${post.id}`} />
              <ReportButton postId={post.id} />
            </div>

            {canManage && (
              <div className="mt-4 rounded-xl bg-soft p-3">
                <p className="mb-2 text-xs font-semibold text-muted">{isOwner ? "내가 쓴 글" : "관리자 메뉴"}</p>
                <OwnerActions postId={post.id} canRenew={isOwner} size="sm" redirectTo={isOwner ? "/mypage" : "/admin/posts"} />
              </div>
            )}
          </div>
        </aside>

        <div className="min-w-0 lg:col-start-1 lg:row-start-2">
          <section aria-labelledby="desc-title" className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-7">
            <h2 id="desc-title" className="mb-4 text-lg font-extrabold tracking-[-0.03em]">
              상세 설명
            </h2>
            <div className="prose-body">{post.description}</div>
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

      {publicNow && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 p-3 backdrop-blur lg:hidden">
          <div className="mx-auto max-w-[520px]">
            <ExternalCta href={post.externalUrl} postId={post.id} label={label} />
          </div>
        </div>
      )}
    </div>
  );
}
