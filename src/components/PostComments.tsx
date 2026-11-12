import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listPostComments } from "@/lib/post-comments";
import { PostCommentForm } from "./PostCommentForm";
export async function PostComments({postId}:{postId:number}){
 const user=await getCurrentUser();
 const result=await listPostComments(postId).catch(()=>null);
 return <section id="comments" className="mt-10 rounded-2xl border border-line bg-white p-5" aria-labelledby="post-comments-title">
 <h2 id="post-comments-title" className="text-lg font-extrabold">댓글{result?" · "+result.count:""}</h2>
 <p className="mt-1 text-sm text-muted">궁금한 점과 이용 경험을 나눠주세요. 연락처 등 개인정보는 남기지 마세요.</p>
 {!result?<p role="status" className="py-4 text-sm text-muted">댓글을 불러오지 못했어요. 잠시 후 다시 방문해주세요.</p>:<>
 {user&&user.status!=="blocked"?<PostCommentForm postId={postId}/>:<Link className="mt-4 inline-block text-sm text-brand" href={"/auth?next="+encodeURIComponent("/post/"+postId+"#comments")}>{user?"이용이 제한된 계정은 댓글을 작성할 수 없어요.":"로그인하고 댓글 쓰기"}</Link>}
 {result.count>100&&<p className="mt-3 text-xs text-muted">최근 댓글 100개를 표시합니다.</p>}
 <ul className="mt-4 divide-y divide-line">{result.items.map(c=><li key={c.id} id={"comment-"+c.id} className="py-4"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm">{c.nickname}</strong><time className="text-xs text-muted" dateTime={c.created_at}>{new Intl.DateTimeFormat("ko-KR",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Seoul"}).format(new Date(c.created_at))}</time>{c.updated_at!==c.created_at&&<span className="text-xs text-muted">수정됨</span>}</div><p className="mt-2 whitespace-pre-wrap break-words text-sm">{c.body}</p>{user&&user.status!=="blocked"&&(user.id===c.author_id||user.isAdmin)&&<div className="mt-2 flex flex-wrap gap-3">{user.id===c.author_id&&<details className="w-full"><summary className="cursor-pointer text-xs text-muted">수정</summary><PostCommentForm postId={postId} commentId={c.id} mode="edit" body={c.body}/></details>}<PostCommentForm postId={postId} commentId={c.id} mode="delete"/></div>}</li>)}</ul>
 {!result.count&&<p className="py-5 text-sm text-muted">첫 댓글을 남겨보세요.</p>}
 </>}
 </section>;
}
