import "server-only";
import { getAdminClient } from "./supabase/admin";
export type PostComment = { id:number; post_id:number; author_id:string|null; nickname:string; body:string; created_at:string; updated_at:string };
export async function listPostComments(postId:number) {
 const {data,error,count}=await getAdminClient().from("post_comments").select("id,post_id,author_id,nickname,body,created_at,updated_at",{count:"exact"}).eq("post_id",postId).is("deleted_at",null).order("created_at",{ascending:false}).order("id",{ascending:false}).limit(100);
 if(error) throw new Error("COMMENTS_UNAVAILABLE");
 return {items:data as PostComment[],count:count??0};
}
