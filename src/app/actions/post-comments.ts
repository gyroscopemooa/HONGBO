"use server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";
import { store } from "@/lib/store";
import { isPostPublic } from "@/lib/queries";
import { findBannedKeyword } from "@/lib/policy";
import { rateLimit } from "@/lib/ratelimit";
export type CommentResult={ok:boolean;message:string};
export async function savePostComment(_previous:CommentResult,form:FormData):Promise<CommentResult>{
 const user=await getCurrentUser();
 if(!user) return {ok:false,message:"로그인이 필요해요."};
 if(user.status==="blocked") return {ok:false,message:"이용이 제한된 계정이에요."};
 const postId=Number(form.get("postId")),id=Number(form.get("commentId")),mode=String(form.get("mode")??"create"),body=String(form.get("body")??"").trim();
 if(!Number.isSafeInteger(postId)||postId<=0||!["create","edit","delete"].includes(mode)||(mode!=="create"&&(!Number.isSafeInteger(id)||id<=0))) return {ok:false,message:"잘못된 요청이에요."};
 if(mode!=="delete"&&(body.length<1||body.length>3000||findBannedKeyword(body))) return {ok:false,message:"댓글은 금지된 내용 없이 1~3,000자로 입력해주세요."};
 if(!rateLimit("post-comment:"+user.id,15,60000)) return {ok:false,message:"잠시 후 다시 시도해주세요."};
 try{
 const post=await store.getPost(postId);
 if(!post||!isPostPublic(post))return {ok:false,message:"현재 공개 중인 글에만 댓글을 남길 수 있어요."};
 const db=getAdminClient();
 if(mode==="create"){
 const {error}=await db.from("post_comments").insert({post_id:postId,author_id:user.id,nickname:user.nickname.slice(0,100)||"회원",body});
 if(error)throw error;
 }else{
 let query=db.from("post_comments").update(mode==="delete"?{body:"삭제된 댓글입니다.",deleted_at:new Date().toISOString(),updated_at:new Date().toISOString()}:{body,updated_at:new Date().toISOString()}).eq("id",id).eq("post_id",postId).is("deleted_at",null);
 if(mode==="edit"||!user.isAdmin)query=query.eq("author_id",user.id);
 const {data,error}=await query.select("id");
 if(error)throw error;
 if(!data?.length)return {ok:false,message:"댓글이 없거나 변경할 권한이 없어요."};
 }
 revalidatePath("/post/"+postId);
 return {ok:true,message:mode==="delete"?"댓글을 삭제했어요.":mode==="edit"?"댓글을 수정했어요.":"댓글을 등록했어요."};
 }catch{return {ok:false,message:"댓글을 처리하지 못했어요. 잠시 후 다시 시도해주세요."};}
}
