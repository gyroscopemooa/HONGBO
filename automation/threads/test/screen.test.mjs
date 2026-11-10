import test from 'node:test';
import assert from 'node:assert/strict';
import { needsThreadsReview } from '../src/screen.mjs';
const source = { title:'일정 관리 서비스',short_description:'할 일을 정리하는 웹 서비스',description:'일정을 기록하고 확인할 수 있습니다.',extra:{siteUrl:'https://example.com'},images:[] };
test('ordinary text-only promotion can pass automated screening',()=>assert.equal(needsThreadsReview(source),false));
test('personal data in all published source metadata and unknown media needs review',()=>{
  for(const patch of [
    {description:'문의 010-1234-5678'}, {short_description:'user@example.com'},
    {extra:{note:'고객명 홍길동'}}, {contact:'연락처'}, {address:'주소'},
    {primary_image_url:'https://example.com/image.png'}, {images:['https://example.com/image.png']},
    {external_url:'https://example.com/?token=abcdef'}, {tags:['병력']},
    {description:'０１０－１２３４－５６７８'},
  ]) assert.equal(needsThreadsReview({...source,...patch}),true,JSON.stringify(patch));
});
