import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

// 더 안전한 객체 찾기 함수
function findObjectBounds(content: string, objectName: string, isArray: boolean = false) {
  // 여러 패턴 시도
  const patterns = isArray ? [
    `const ${objectName} = \\[`,
    `const ${objectName}: .*? = \\[`,
    `const ${objectName}:\\s*Array<.*?>\\s*=\\s*\\[`
  ] : [
    `const ${objectName} = \\{`,
    `const ${objectName}: .*? = \\{`
  ]

  let startIndex = -1
  let startMatch = ''

  // 정규식으로 시작점 찾기
  for (const pattern of patterns) {
    const regex = new RegExp(pattern)
    const match = content.match(regex)
    if (match && match.index !== undefined) {
      startIndex = match.index
      startMatch = match[0]
      break
    }
  }

  if (startIndex === -1) {
    return null
  }

  // 개선된 중괄호/대괄호 균형 찾기
  const openChar = isArray ? '[' : '{'
  const closeChar = isArray ? ']' : '}'
  let depth = 0
  let inString = false
  let stringChar = ''
  let escapeNext = false
  let inComment = false
  let inMultiLineComment = false

  // 시작 위치부터 파싱
  const startPos = startIndex + startMatch.length - 1

  for (let i = startPos; i < content.length; i++) {
    const char = content[i]
    const nextChar = content[i + 1]
    const prevChar = content[i - 1]

    // 멀티라인 주석 처리
    if (!inString && !inComment && char === '/' && nextChar === '*') {
      inMultiLineComment = true
      i++
      continue
    }
    if (inMultiLineComment && char === '*' && nextChar === '/') {
      inMultiLineComment = false
      i++
      continue
    }
    if (inMultiLineComment) continue

    // 단일 라인 주석 처리
    if (!inString && !inMultiLineComment && char === '/' && nextChar === '/') {
      inComment = true
      continue
    }
    if (inComment && char === '\n') {
      inComment = false
      continue
    }
    if (inComment) continue

    // 이스케이프 문자 처리
    if (escapeNext) {
      escapeNext = false
      continue
    }
    if (char === '\\') {
      escapeNext = true
      continue
    }

    // 문자열 처리 (템플릿 리터럴 포함)
    if (!inString && (char === '"' || char === "'" || char === '`')) {
      inString = true
      stringChar = char
      continue
    }
    if (inString && char === stringChar && prevChar !== '\\') {
      inString = false
      stringChar = ''
      continue
    }

    // 문자열 내부면 건너뛰기
    if (inString) continue

    // 중괄호/대괄호 카운팅
    if (char === openChar) {
      depth++
    } else if (char === closeChar) {
      depth--
      if (depth === 0) {
        return { startIndex, endIndex: i }
      }
    }
  }

  return null
}

export async function POST(request: NextRequest) {
  // 🔒 개발 환경에서만 작동 (배포 시 자동 비활성화)
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: '개발 모드에서만 사용 가능합니다' },
      { status: 403 }
    )
  }

  try {
    const { component, section, data } = await request.json()

    // 📁 수정 가능한 컴포넌트 파일들
    const componentFiles: Record<string, string> = {
      'hero': 'components/hero.tsx',
      'about': 'components/about.tsx',
      'projects': 'components/projects.tsx',
      'contact': 'components/contact.tsx',
      'footer': 'components/footer.tsx',
      'header': 'components/header.tsx',
      'navbar': 'components/navbar.tsx'
    }

    const fileName = componentFiles[component]
    if (!fileName) {
      return NextResponse.json(
        { error: '허용되지 않은 컴포넌트입니다' },
        { status: 400 }
      )
    }

    // 파일 읽기
    const filePath = path.join(process.cwd(), fileName)
    const originalContent = await fs.readFile(filePath, 'utf-8')

    let content = originalContent

    // 🎯 defaultInfo/defaultConfig 객체 찾아서 교체
    const objectName = `default${section || 'Info'}`
    const isArray = section === 'SocialLinks'

    // 안전한 파싱으로 객체 경계 찾기
    const bounds = findObjectBounds(content, objectName, isArray)

    if (!bounds) {
      // 객체를 찾을 수 없는 경우 오류 반환
      return NextResponse.json(
        { error: `${objectName} 객체를 찾을 수 없습니다` },
        { status: 400 }
      )
    }

    // 새로운 객체 내용 생성
    let newObjectContent: string

    if (isArray) {
      // 배열인 경우 JSON.stringify 사용
      newObjectContent = JSON.stringify(data, null, 2)
        .split('\n')
        .map((line, index) => index === 0 ? line : `  ${line}`)
        .join('\n')
    } else {
      // 객체인 경우 각 속성을 개별 처리
      const contentArray = Object.entries(data).map(([key, value]) => {
        // header 컴포넌트의 items 처리 - 아이콘을 문자열로 변환
        if (component === 'header' && key === 'items' && Array.isArray(value)) {
          const itemsWithStringIcons = value.map((item: { icon?: unknown; [key: string]: unknown }) => ({
            ...item,
            icon: typeof item.icon === 'string' ? item.icon : "Home"
          }))
          return `    ${key}: ${JSON.stringify(itemsWithStringIcons)}`
        } else if (typeof value === 'string') {
          // 문자열 값 이스케이프 처리
          const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
          return `    ${key}: "${escaped}"`
        } else if (Array.isArray(value)) {
          // projects 배열인 경우 타입 정의 추가
          if (component === 'projects' && key === 'projects') {
            return `    ${key}: ${JSON.stringify(value)} as Array<{ image: string; video?: string; title: string; description: string }>`
          }
          return `    ${key}: ${JSON.stringify(value)}`
        } else {
          return `    ${key}: ${JSON.stringify(value)}`
        }
      }).join(',\n')

      newObjectContent = contentArray
    }

    // 타입 정의를 유지하면서 새로운 객체 생성
    let newDefaultObject: string

    if (isArray) {
      // 원래 타입 정의 추출
      const originalDeclaration = content.substring(bounds.startIndex, bounds.endIndex + 1)
      const typeMatch = originalDeclaration.match(new RegExp(`const ${objectName}(:[^=]+)? = \\[`))
      const typeDefinition = typeMatch && typeMatch[1] ? typeMatch[1] : ': { name: string; icon: string; url: string }[]'
      newDefaultObject = `const ${objectName}${typeDefinition} = ${newObjectContent}`
    } else {
      newDefaultObject = `const ${objectName} = {\n${newObjectContent}\n  }`
    }

    // 파일 내용 교체
    const beforeContent = content.substring(0, bounds.startIndex)
    const afterContent = content.substring(bounds.endIndex + 1)
    content = beforeContent + newDefaultObject + afterContent

    // 파일 저장 전 검증
    if (content.length < originalContent.length * 0.5) {
      // 파일 크기가 너무 작아진 경우 오류로 처리
      console.error('⚠️ 파일 크기가 비정상적으로 줄어듦. 저장 취소.')
      return NextResponse.json(
        { error: '파일 처리 중 오류가 발생했습니다. 원본 파일은 그대로 유지됩니다.' },
        { status: 500 }
      )
    }

    // 파일 저장
    await fs.writeFile(filePath, content, 'utf-8')

    console.log(`✅ ${fileName} 파일이 업데이트되었습니다`)

    // header 컴포넌트인 경우 layout.tsx의 metadata도 업데이트
    if (component === 'header' && section === 'Config') {
      try {
        // layout.tsx 파일 읽기
        const layoutPath = path.join(process.cwd(), 'app/layout.tsx')
        let layoutContent = await fs.readFile(layoutPath, 'utf-8')

        // import 문이 있는지 확인하고 없으면 추가
        if (!layoutContent.includes('import { getMetadata }')) {
          const importInsertPoint = layoutContent.indexOf('import "./globals.css"')
          if (importInsertPoint !== -1) {
            layoutContent = layoutContent.slice(0, importInsertPoint) +
              'import { getMetadata } from "@/lib/metadata"\n' +
              layoutContent.slice(importInsertPoint)
          }
        }

        // metadataInfo 변수가 있는지 확인하고 없으면 추가
        if (!layoutContent.includes('const metadataInfo = getMetadata()')) {
          const insertPoint = layoutContent.indexOf('export const metadata')
          if (insertPoint !== -1) {
            layoutContent = layoutContent.slice(0, insertPoint) +
              'const metadataInfo = getMetadata()\n\n' +
              layoutContent.slice(insertPoint)
          }
        }

        // layout.tsx 저장
        await fs.writeFile(layoutPath, layoutContent, 'utf-8')
        console.log('✅ layout.tsx도 함께 업데이트되었습니다')
      } catch (layoutError) {
        console.error('layout.tsx 업데이트 오류:', layoutError)
        // layout.tsx 업데이트 실패해도 메인 작업은 성공으로 처리
      }
    }

    return NextResponse.json({
      success: true,
      message: '파일이 성공적으로 저장되었습니다'
    })

  } catch (error) {
    console.error('파일 저장 오류:', error)
    return NextResponse.json(
      { error: '파일 저장 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}