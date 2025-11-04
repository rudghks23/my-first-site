// 이미지 관련 localStorage 데이터만 초기화
export function resetImagePaths() {
  if (typeof window === 'undefined') return
  
  const keysToClean = [
    'portfolio-hero-info',
    'portfolio-hero-background', 
    'portfolio-about-info',
    'portfolio-about-background',
    'portfolio-projects'
  ]
  
  keysToClean.forEach(key => {
    const data = localStorage.getItem(key)
    if (!data) return
    
    try {
      const parsed = JSON.parse(data)
      
      // 이미지 필드 초기화
      if (parsed.profileImage?.includes('/uploads/')) parsed.profileImage = ''
      if (parsed.backgroundImage?.includes('/uploads/')) parsed.backgroundImage = ''
      if (parsed.image?.includes('/uploads/')) parsed.image = ''
      if (parsed.video?.includes('/uploads/')) parsed.video = ''
      
      // 배열인 경우 (projects)
      if (Array.isArray(parsed)) {
        parsed.forEach(item => {
          if (item.image?.includes('/uploads/')) item.image = ''
          if (item.video?.includes('/uploads/')) item.video = ''
        })
      }
      
      localStorage.setItem(key, JSON.stringify(parsed))
      console.log(`Cleaned image paths from ${key}`)
    } catch (e) {
      console.error(`Error cleaning ${key}:`, e)
    }
  })
  
  console.log('Image paths reset complete. Please refresh the page.')
}