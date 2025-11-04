import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(req: NextRequest) {
  try {
    // uploads 폴더에서 hero-profile로 시작하는 이미지 찾기
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir)
      const profileImage = files.find(file => 
        file.startsWith('hero-profile') && 
        (file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png') || file.endsWith('.webp'))
      )
      
      if (profileImage) {
        const imagePath = path.join(uploadsDir, profileImage)
        const imageBuffer = fs.readFileSync(imagePath)
        
        // 이미지 타입 결정
        const ext = path.extname(profileImage).toLowerCase()
        const contentType = 
          ext === '.png' ? 'image/png' :
          ext === '.webp' ? 'image/webp' :
          'image/jpeg'
        
        return new NextResponse(imageBuffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600',
          },
        })
      }
    }
    
    // 프로필 이미지가 없으면 기본 OG 이미지 생성 (단색 배경)
    const svg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <rect width="1200" height="630" fill="#3b82f6"/>
        <text x="50%" y="50%" font-family="Pretendard, sans-serif" font-size="72" fill="white" text-anchor="middle" dominant-baseline="middle">
          나의 포트폴리오
        </text>
      </svg>
    `
    
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('OG 이미지 생성 실패:', error)
    return NextResponse.json({ error: 'Failed to generate OG image' }, { status: 500 })
  }
}