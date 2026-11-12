"use client";
import { useActionState,useEffect,useRef } from "react";
import { savePostComment } from "@/app/actions/post-comments";
export function PostCommentForm({postId,commentId,mode="create",body=""}:{postId:number;commentId?:number;mode?:"create"|"edit"|"delete";body?:string}){
 const [state,action,pending]=useActionState(savePostComment,{ok:false,message:""});
 const ref=useRef<HTMLFormElement>(null);
 useEffect(()=>{if(state.ok&&mode==="create")ref.current?.reset();},[state,mode]);
 return <form ref={ref} action={action} className={mode==="delete"?"":"mt-4"} onSubmit={e=>{if(mode==="delete"&&!window.confirm("댓글을 삭제할까요?"))e.preventDefault();}}>
 <input type="hidden" name="postId" value={postId}/><input type="hidden" name="commentId" value={commentId??""}/><input type="hidden" name="mode" value={mode}/>
 {mode!=="delete"&&<label className="block text-sm"><span className="sr-only">{mode==="edit"?"댓글 수정 내용":"댓글 내용"}</span><textarea name="body" required minLength={1} maxLength={3000} defaultValue={body} rows={3} className="w-full rounded-lg border border-line p-3" placeholder="댓글을 입력해주세요 (최대 3,000자)"/></label>}
 <button disabled={pending} className={mode==="delete"?"text-xs text-muted hover:text-red-600 disabled:opacity-50":"btn btn-primary mt-2 disabled:opacity-50"}>{pending?"처리 중…":mode==="delete"?"삭제":mode==="edit"?"수정 저장":"댓글 등록"}</button>
 {state.message&&<p role="status" className={"mt-2 text-sm "+(state.ok?"text-brand":"text-red-600")}>{state.message}</p>}
 </form>;
}
