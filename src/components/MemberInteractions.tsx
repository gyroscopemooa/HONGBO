"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { MemberComment } from "@/lib/member-community";
import {
  applyMemberPostAction,
  cancelMemberApplicationAction,
  setMemberApplicationStatusAction,
  addMemberCommentAction,
  deleteMemberCommentAction,
  setMemberPostStateAction,
  reportMemberContentAction,
  markMemberNotificationsReadAction,
} from "@/app/actions/member-community";

type Result =
  { ok: true; id?: number } | { ok: false; message: string; login?: boolean };
export function MemberCommand({
  label,
  run,
  confirm,
}: {
  label: string;
  run: () => Promise<Result>;
  confirm?: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();
  return (
    <span className="inline-flex flex-col">
      <button
        className="btn btn-outline btn-sm"
        disabled={pending}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          setError("");
          start(async () => {
            try {
              const r = await run();
              if (!r.ok) setError(r.message);
              else router.refresh();
            } catch {
              setError("처리하지 못했어요. 다시 시도해주세요.");
            }
          });
        }}
      >
        {pending ? "처리 중…" : label}
      </button>
      {error && (
        <span role="alert" className="text-sm text-red-700">
          {error}
        </span>
      )}
    </span>
  );
}
export function MemberPostControls({
  id,
  closed,
  owner,
  admin,
}: {
  id: number;
  closed: boolean;
  owner: boolean;
  admin: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {owner && (
        <>
          <Link className="btn btn-outline btn-sm" href={`/talk/${id}/edit`}>
            수정
          </Link>
          <MemberCommand
            label={closed ? "모집 다시 열기" : "모집 마감"}
            run={() =>
              setMemberPostStateAction(id, closed ? "reopen" : "close")
            }
          />
          <MemberCommand
            label="글 삭제"
            confirm="이 글을 삭제할까요?"
            run={() => setMemberPostStateAction(id, "delete")}
          />
        </>
      )}
      {admin && (
        <MemberCommand
          label="관리자 숨김"
          confirm="이 글을 숨길까요?"
          run={() => setMemberPostStateAction(id, "hide")}
        />
      )}
    </div>
  );
}
export function MemberReport({
  postId,
  commentId,
}: {
  postId: number;
  commentId?: number;
}) {
  const [reason, setReason] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-muted">신고</summary>
      {sent ? (
        <p role="status">신고가 접수되었어요.</p>
      ) : (
        <div className="my-2 flex flex-wrap gap-2">
          <input
            className="field min-w-0"
            aria-label="신고 사유"
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="신고 사유를 적어주세요"
          />
          <MemberCommand
            label="신고 보내기"
            run={async () => {
              const r = await reportMemberContentAction(
                postId,
                reason,
                commentId,
              );
              if (r.ok) setSent(true);
              return r;
            }}
          />
        </div>
      )}
    </details>
  );
}
export function MemberComments({
  postId,
  comments,
  userId,
  isAdmin,
}: {
  postId: number;
  comments: MemberComment[];
  userId?: string;
  isAdmin: boolean;
}) {
  const [reply, setReply] = useState<number | undefined>();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const visible = comments.filter((c) => c.status === "active");
  const render = (c: MemberComment) => (
    <li
      key={c.id}
      id={`comment-${c.id}`}
      className="break-words border-b border-line py-4"
    >
      <p className="text-sm font-bold">
        {c.nickname}
        <time className="ml-2 font-normal text-muted">
          {new Date(c.createdAt).toLocaleDateString("ko-KR", {
            timeZone: "Asia/Seoul",
          })}
        </time>
      </p>
      <p className="my-2 whitespace-pre-wrap">
        {c.status === "active" ? c.body : "삭제된 댓글입니다."}
      </p>
      <div className="flex flex-wrap items-start gap-3">
        {userId && c.status === "active" && !c.parentId && (
          <button
            className="text-sm font-bold text-brand"
            onClick={() => {
              setReply(c.id);
              document.getElementById("member-comment-body")?.focus();
            }}
          >
            답글
          </button>
        )}
        {(c.authorId === userId || isAdmin) && c.status === "active" && (
          <MemberCommand
            label="삭제"
            confirm="댓글을 삭제할까요?"
            run={() => deleteMemberCommentAction(c.id)}
          />
        )}
        <MemberReport postId={postId} commentId={c.id} />
      </div>
      {comments.filter((x) => x.parentId === c.id).length > 0 && (
        <ul className="ml-3 border-l border-line pl-3 sm:ml-5">
          {comments.filter((x) => x.parentId === c.id).map(render)}
        </ul>
      )}
    </li>
  );
  return (
    <section aria-labelledby="comments-heading" className="mt-8">
      <h2 id="comments-heading" className="text-xl font-bold">
        댓글 · {visible.length}
      </h2>
      <p className="my-2 text-sm text-muted">
        질문과 피드백을 주고받아 보세요. 댓글·답글 알림은 사이트 내 알림함에서
        확인할 수 있어요.
      </p>
      {comments.length ? (
        <ul>{comments.filter((c) => !c.parentId).map(render)}</ul>
      ) : (
        <p className="py-6 text-muted">첫 질문이나 피드백을 남겨주세요.</p>
      )}
      {userId ? (
        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            start(async () => {
              try {
                const r = await addMemberCommentAction(postId, body, reply);
                if (!r.ok) {
                  setError(r.message);
                  return;
                }
                setBody("");
                setReply(undefined);
                router.refresh();
              } catch {
                setError("댓글을 등록하지 못했어요. 다시 시도해주세요.");
              }
            });
          }}
        >
          {reply && (
            <p className="mb-2 text-sm">
              {comments.find((c) => c.id === reply)?.nickname}님에게 답글{" "}
              <button
                type="button"
                className="ml-2 underline"
                onClick={() => setReply(undefined)}
              >
                취소
              </button>
            </p>
          )}
          <label htmlFor="member-comment-body" className="sr-only">
            댓글 내용
          </label>
          <textarea
            id="member-comment-body"
            className="field w-full"
            rows={4}
            maxLength={3000}
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="전화번호·이메일·주소 등 개인정보는 공개하지 마세요."
          />
          {error && (
            <p role="alert" className="text-red-700">
              {error}
            </p>
          )}
          <button disabled={pending} className="btn btn-primary mt-2">
            {pending ? "등록 중…" : "댓글 등록"}
          </button>
        </form>
      ) : (
        <Link
          href={`/auth?next=${encodeURIComponent(`/talk/${postId}#comments-heading`)}`}
          className="btn btn-outline mt-4"
        >
          로그인하고 댓글 쓰기
        </Link>
      )}
    </section>
  );
}
export function MarkMemberNotificationsRead() {
  return (
    <MemberCommand label="모두 읽음" run={markMemberNotificationsReadAction} />
  );
}

export function MemberModeration({
  postId,
  commentId,
  hidden,
}: {
  postId: number;
  commentId?: number | null;
  hidden: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <MemberCommand
        label={hidden ? "글 복원" : "글 숨김"}
        confirm={hidden ? "글을 다시 공개할까요?" : "글을 숨길까요?"}
        run={() =>
          setMemberPostStateAction(postId, hidden ? "restore" : "hide")
        }
      />
      {commentId && (
        <MemberCommand
          label="신고된 댓글 삭제"
          confirm="이 댓글을 삭제할까요?"
          run={() => deleteMemberCommentAction(commentId)}
        />
      )}
    </div>
  );
}

export function MemberApplications({
  postId,
  closed,
  owner,
  userId,
  applications,
}: {
  postId: number;
  closed: boolean;
  owner: boolean;
  userId?: string;
  applications: import("@/lib/member-community").MemberApplication[];
}) {
  const [note, setNote] = useState("");
  const mine = applications.find((x) => x.applicantId === userId);
  const labels = {
    pending: "확인 대기",
    accepted: "참여 승인",
    declined: "참여 불가",
    cancelled: "취소",
  };
  return (
    <section className="mt-6 rounded-xl border border-line p-4">
      <h2 className="text-lg font-bold">참여 신청</h2>
      <p className="my-2 text-sm text-muted">
        신청 내용은 작성자와 관리자만 확인합니다. 개인정보는 적지 마세요. 궁금한
        점과 공개 피드백은 아래 댓글로 나눠주세요.
      </p>
      {owner ? (
        <>
          <p className="my-3 text-sm">신청 {applications.length}건</p>
          <ul className="divide-y divide-line">
            {applications.map((a) => (
              <li className="space-y-2 py-3" key={a.id}>
                <p className="font-bold">
                  {a.nickname} · {labels[a.status]}
                </p>
                <p className="whitespace-pre-wrap break-words text-sm">
                  {a.note}
                </p>
                {a.status === "pending" && (
                  <div className="flex gap-2">
                    <MemberCommand
                      label="참여 승인"
                      run={() =>
                        setMemberApplicationStatusAction(a.id, "accepted")
                      }
                    />
                    <MemberCommand
                      label="참여 불가"
                      run={() =>
                        setMemberApplicationStatusAction(a.id, "declined")
                      }
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      ) : !userId ? (
        <Link
          className="btn btn-outline"
          href={`/auth?next=${encodeURIComponent(`/talk/${postId}`)}`}
        >
          로그인하고 신청하기
        </Link>
      ) : (
        <>
          {mine && (
            <p className="my-3 font-bold">내 신청: {labels[mine.status]}</p>
          )}
          {mine && mine.status !== "cancelled" ? (
            <MemberCommand
              label="신청 취소"
              confirm="참여 신청을 취소할까요?"
              run={() => cancelMemberApplicationAction(postId)}
            />
          ) : closed ? (
            <p>모집이 마감되었어요.</p>
          ) : (
            <>
              <label className="block">
                작성자에게 남길 말
                <textarea
                  maxLength={1000}
                  rows={3}
                  className="field my-2 w-full"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>
              <MemberCommand
                label="참여 신청하기"
                run={() => applyMemberPostAction(postId, note)}
              />
            </>
          )}
        </>
      )}
    </section>
  );
}
