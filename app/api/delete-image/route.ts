import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function DELETE(request: NextRequest) {
  // 개발 환경에서만 작동
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: '개발 모드에서만 사용 가능합니다' },
      { status: 403 }
    )
  }

  try {
    const { imagePath } = await request.json()
    
    if (!imagePath) {
      return NextResponse.json(
        { error: '파일 경로가 필요합니다' },
        { status: 400 }
      )
    }

    // 안전성 검사: uploads 폴더 내의 파일만 삭제 가능
    if (!imagePath.startsWith('/uploads/')) {
      return NextResponse.json(
        { error: 'uploads 폴더의 파일만 삭제 가능합니다' },
        { status: 400 }
      )
    }

    // 파일 경로 생성
    const fileName = imagePath.replace('/uploads/', '')
    const filePath = path.join(process.cwd(), 'public', 'uploads', fileName)
    
    // 파일 존재 확인
    try {
      await fs.access(filePath)
    } catch {
      return NextResponse.json(
        { error: '파일을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 파일 삭제
    await fs.unlink(filePath)
    
    const fileType = imagePath.includes('video') ? '비디오' : '이미지'
    console.log(`🗑️ ${fileType} 삭제 완료: ${imagePath}`)
    
    return NextResponse.json({ 
      success: true,
      message: `${fileType}가 삭제되었습니다`
    })
    
  } catch (error) {
    console.error('파일 삭제 오류:', error)
    return NextResponse.json(
      { error: '파일 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}