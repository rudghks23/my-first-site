import { defaultConfig } from "@/components/header"

// 메타데이터 헬퍼 함수
export function getMetadata() {
  // localStorage는 서버 사이드에서 사용할 수 없으므로 기본값 사용
  const defaultInfo = {
    name: "당신의 이름",
    title: "프론트엔드 개발자",
    description: defaultConfig.siteDescription, // header의 defaultConfig에서 가져오기
    profileImage: "",
    siteTitle: defaultConfig.siteTitle, // header의 defaultConfig에서 가져오기
  }
  
  // 클라이언트 사이드에서만 localStorage 접근
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('hero-info')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return { ...defaultInfo, ...parsed }
      } catch {
        return defaultInfo
      }
    }
  }
  
  return defaultInfo
}