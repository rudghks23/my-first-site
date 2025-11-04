import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  // 개발 환경에서만 작동
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: '개발 모드에서만 사용 가능합니다' },
      { status: 403 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const purpose = formData.get('purpose') as string || 'general' // hero-profile, hero-background, about-image 등
    const oldPath = formData.get('oldPath') as string || '' // 기존 파일 경로
    
    if (!file) {
      return NextResponse.json(
        { error: '파일이 없습니다' },
        { status: 400 }
      )
    }

    // 파일 확장자 확인
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    const fileExtension = path.extname(file.name).toLowerCase()
    
    if (!validExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: '이미지 파일만 업로드 가능합니다' },
        { status: 400 }
      )
    }

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: '파일 크기는 5MB 이하여야 합니다' },
        { status: 400 }
      )
    }

    // 의미있는 파일명 생성 (purpose-timestamp.ext)
    const timestamp = Date.now()
    const uniqueFileName = `${purpose}-${timestamp}${fileExtension}`
    const publicPath = path.join(process.cwd(), 'public', 'uploads')
    
    // uploads 폴더가 없으면 생성
    try {
      await fs.access(publicPath)
    } catch {
      await fs.mkdir(publicPath, { recursive: true })
    }

    // 기존 파일 삭제 (같은 purpose의 이전 파일들 삭제)
    if (oldPath && oldPath.startsWith('/uploads/')) {
      try {
        const oldFileName = oldPath.replace('/uploads/', '')
        const oldFilePath = path.join(publicPath, oldFileName)
        await fs.unlink(oldFilePath)
        console.log(`🗑️ 기존 파일 삭제: ${oldPath}`)
      } catch (error) {
        console.log('기존 파일 삭제 실패 (파일이 없을 수 있음):', error)
      }
    }
    
    // 같은 purpose의 다른 파일들도 삭제
    try {
      const files = await fs.readdir(publicPath)
      for (const existingFile of files) {
        if (existingFile.startsWith(`${purpose}-`) && existingFile !== uniqueFileName) {
          const fileToDelete = path.join(publicPath, existingFile)
          await fs.unlink(fileToDelete)
          console.log(`🗑️ 이전 ${purpose} 파일 삭제: ${existingFile}`)
        }
      }
    } catch (error) {
      console.log('이전 파일 정리 중 오류:', error)
    }

    // 파일 저장
    const filePath = path.join(publicPath, uniqueFileName)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    await fs.writeFile(filePath, buffer)
    
    // 웹에서 접근 가능한 경로 반환
    const webPath = `/uploads/${uniqueFileName}`
    
    console.log(`✅ 이미지 업로드 완료: ${webPath}`)
    
    return NextResponse.json({ 
      success: true,
      path: webPath,
      filename: uniqueFileName
    })
    
  } catch (error) {
    console.error('파일 업로드 오류:', error)
    return NextResponse.json(
      { error: '파일 업로드 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}