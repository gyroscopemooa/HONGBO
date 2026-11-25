import type { Metadata } from "next";
import Link from "next/link";
import { SERVICE_GUIDES } from "@/data/service-guides";
import { ServiceGuideCards } from "@/components/ServiceGuideCards";
import { SERVICE_FIELDS } from "@/lib/constants";
export const metadata: Metadata = { title: "스냅사진·심리상담·전문 서비스 이용 가이드", description: "스냅사진, 심리검사, 상담, 작업치료, 레슨, 축가 등 전문 서비스를 비교하고 문의하는 방법.", alternates: { canonical: "/service-guides" } };
export default function ServiceGuidesPage() { return <main className="wrap py-8"><h1 className="text-3xl font-black">전문 서비스 이용 가이드</h1><p className="mt-2 text-muted">촬영부터 상담, 치료, 교육, 생활 서비스까지 선택할 때 확인할 정보를 모았습니다.</p><Link href="/category/services" className="btn btn-primary mt-4">서비스 홍보글 둘러보기</Link>{Object.entries(SERVICE_FIELDS).map(([field, info]) => <ServiceGuideCards key={field} guides={SERVICE_GUIDES.filter(g => g.field === field)} heading={info.name} />)}</main>; }
