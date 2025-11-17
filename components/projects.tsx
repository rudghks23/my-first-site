"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { X, Plus, Upload, ChevronDown, LayoutGrid } from "lucide-react"
import { EditableText } from "@/components/editable/editable-text"
import { EditableMedia } from "@/components/editable/editable-media"
import { EditableBackground } from "@/components/editable/editable-background"
import { useInlineEditor } from "@/contexts/inline-editor-context"
import { COMMON_STYLES } from "@/lib/constants"

// ---------- 타입 정의 ----------
type Project = {
  image: string
  video?: string
  title: string
  description: string
  pdfUrl?: string
}

type ProjectsInfo = {
  title: string
  subtitle: string
  initialDisplay: number
  loadMoreCount: number
  background: {
    image: string
    video: string
    color: string
    opacity: number
  }
  projects: Project[]
}

// ---------- 컴포넌트 ----------
export function Projects() {
  const { getData, saveData, isEditMode, saveToFile } = useInlineEditor()

  // 기본 데이터
  const defaultInfo = {
    title: "프로젝트",
    subtitle: "프로젝트",
    initialDisplay: 6,
    loadMoreCount: 3,
    background: {"image":"","video":"","color":"","opacity":0.1},
    projects: [{"image":"/uploads/project-1763364464027-1763364464067.png","video":"","title":"경매물건 권리분석 보고서 작성","description":"ㅇㅇ","pdfUrl":"/pdfs/auction-report.pdf"},{"image":"/uploads/project-1763364493930-1763364493965.png","video":"","title":"청계천 복원 사업 분석 및 연구","description":"ㅇㅇ","pdfUrl":"/pdfs/cheonggyecheon-report.pdf"}] as Array<{ image: string; video?: string; title: string; description: string }>
  }

  const [projectsInfo, setProjectsInfo] = useState<ProjectsInfo>(defaultInfo)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageAspects, setImageAspects] = useState<{ [key: string]: string }>({})
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [displayCount, setDisplayCount] = useState(defaultInfo.initialDisplay)
  const [showDisplaySettings, setShowDisplaySettings] = useState(false)
  const [newProject, setNewProject] = useState<Project>({
    image: "",
    video: "",
    title: "",
    description: "",
    pdfUrl: "",
  })
  const [backgroundData, setBackgroundData] = useState(defaultInfo.background)

  // ---------- 데이터 로드 ----------
  useEffect(() => {
    const savedData = getData("projects-info") as ProjectsInfo | null
    if (savedData) {
      const mergedData: ProjectsInfo = { ...defaultInfo, ...savedData }
      setProjectsInfo(mergedData)
      setDisplayCount(mergedData.initialDisplay || defaultInfo.initialDisplay)

      if (savedData.background) {
        setBackgroundData(savedData.background)
      }
    }

    const savedBg = getData("projects-background") as
      | { image: string; video: string; color: string; opacity: number }
      | null
    if (savedBg) {
      setBackgroundData(savedBg)
    }
  }, [isEditMode])

  // ---------- 공통 업데이트 ----------
  const updateProjectsInfo = async (
    key: keyof ProjectsInfo,
    value: ProjectsInfo[keyof ProjectsInfo]
  ) => {
    const newInfo = { ...projectsInfo, [key]: value }
    setProjectsInfo(newInfo)
    saveData("projects-info", newInfo)
    await saveToFile("projects", "Info", newInfo)
  }

  const updateProject = async (
    index: number,
    field: keyof Project,
    value: string | undefined
  ) => {
    const newProjects = [...projectsInfo.projects]
    newProjects[index] = { ...newProjects[index], [field]: value ?? "" }
    await updateProjectsInfo("projects", newProjects)
  }

  const removeProject = async (index: number) => {
    const projectToRemove = projectsInfo.projects[index]

    if (projectToRemove.image && projectToRemove.image.includes("/uploads/")) {
      try {
        await fetch("/api/delete-image", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imagePath: projectToRemove.image }),
        })
      } catch (error) {
        console.error("프로젝트 이미지 삭제 실패:", error)
      }
    }

    if (projectToRemove.video && projectToRemove.video.includes("/uploads/")) {
      try {
        await fetch("/api/delete-image", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imagePath: projectToRemove.video }),
        })
      } catch (error) {
        console.error("프로젝트 비디오 삭제 실패:", error)
      }
    }

    const newProjects = projectsInfo.projects.filter((_, i) => i !== index)
    await updateProjectsInfo("projects", newProjects)
  }

  // ---------- 표시 관련 ----------
  const validProjects = projectsInfo.projects
  const visibleProjects = isEditMode
    ? validProjects
    : validProjects.slice(0, displayCount)
  const hasMoreProjects = validProjects.length > displayCount

  const loadMore = () => {
    setDisplayCount((prev) =>
      Math.min(prev + projectsInfo.loadMoreCount, validProjects.length)
    )
  }

  // ---------- 이미지 비율 감지 (지금은 안 써도 무방) ----------
  const detectImageAspect = (src: string) => {
    if (!src) return
    const img = new Image()
    img.onload = () => {
      const ratio = img.width / img.height
      let aspectClass: string
      if (ratio >= 1.7 && ratio <= 1.8) aspectClass = "aspect-video"
      else if (ratio >= 1.3 && ratio <= 1.35) aspectClass = "aspect-[4/3]"
      else if (ratio >= 0.95 && ratio <= 1.05) aspectClass = "aspect-square"
      else if (ratio >= 0.74 && ratio <= 0.76) aspectClass = "aspect-[3/4]"
      else if (ratio >= 0.55 && ratio <= 0.57) aspectClass = "aspect-[9/16]"
      else aspectClass = ratio > 1 ? "aspect-video" : "aspect-[3/4]"

      setImageAspects((prev) => ({ ...prev, [src]: aspectClass }))
    }
    img.src = src
  }

  useEffect(() => {
    validProjects.forEach((project) => detectImageAspect(project.image))
  }, [validProjects.length])

  // ESC로 확대 모달 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedImage(null)
      }
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [])

  // ---------- JSX ----------
  return (
    <>
      <EditableBackground
        image={backgroundData.image}
        video={backgroundData.video}
        color={backgroundData.color}
        opacity={backgroundData.opacity}
        onChange={(data) => {
          const newData = { ...backgroundData, ...data }
          setBackgroundData(newData)
          saveData("projects-background", newData)

          const updatedProjectsInfo = { ...projectsInfo, background: newData }
          setProjectsInfo(updatedProjectsInfo)
          saveData("projects-info", updatedProjectsInfo)
        }}
        storageKey="projects-background"
        className="relative"
      >
        <section id="projects" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* 섹션 제목 */}
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                <EditableText
                  value={projectsInfo.title}
                  onChange={(value) => updateProjectsInfo("title", value)}
                  storageKey="projects-title"
                />
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                <EditableText
                  value={projectsInfo.subtitle}
                  onChange={(value) => updateProjectsInfo("subtitle", value)}
                  storageKey="projects-subtitle"
                />
              </p>
            </div>

            {/* 프로젝트가 없을 때 */}
            {validProjects.length === 0 && !isEditMode ? (
              <div className="text-center py-20">
                <span className="text-6xl block mb-4">🚀</span>
                <p className="text-xl text-muted-foreground">준비 중입니다</p>
              </div>
            ) : (
              // 프로젝트 그리드
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleProjects.map((project, index) => (
                  <div
                    key={index}
                    className="group flex flex-col relative cursor-pointer"
                    onClick={() =>
                      !isEditMode &&
                      setSelectedImage(project.video || project.image)
                    }
                  >
                    {isEditMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeProject(index)
                        }}
                        className={COMMON_STYLES.deleteButton}
                      >
                        <X className={COMMON_STYLES.deleteIcon} />
                      </button>
                    )}

                    {/* 이미지/비디오 영역 */}
                    <div className="relative aspect-[4/3] rounded-lg bg-muted mb-3 overflow-hidden">
                      {project.video ? (
                        <video
                          src={project.video}
                          className="absolute inset-0 w-full h-full object-contain bg-muted transition-transform duration-300 group-hover:scale-105"
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                      ) : (
                        <EditableMedia
                          src={project.image || ""}
                          onChange={(src) => updateProject(index, "image", src)}
                          type="auto"
                          storageKey={`project-${index}-image`}
                          className="absolute inset-0 w-full h-full object-contain bg-muted transition-transform duration-300 group-hover:scale-105"
                          alt={project.title}
                          purpose={`project-${index}`}
                        />
                      )}
                    </div>

                    {/* 텍스트 영역 */}
                    <div className="flex-grow">
                      <h3 className="font-semibold text-foreground mb-1">
                        <EditableText
                          value={project.title || "프로젝트 제목"}
                          onChange={(value) =>
                            updateProject(index, "title", value)
                          }
                          storageKey={`project-${index}-title`}
                        />
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        <EditableText
                          value={project.description || "프로젝트 설명"}
                          onChange={(value) =>
                            updateProject(index, "description", value)
                          }
                          storageKey={`project-${index}-description`}
                          multiline
                        />
                      </p>

                      {/* PDF 다운로드 링크 */}
                      {project.pdfUrl && (
                        <a
                          href={project.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center mt-2 text-sm text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          📄 보고서 다운로드
                        </a>
                      )}
                    </div>
                  </div>
                ))}

                {/* 편집 모드에서 프로젝트 추가 카드 */}
                {isEditMode && (
                  <div
                    className="h-64 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                    onClick={() => setShowProjectModal(true)}
                  >
                    <div className="text-center">
                      <Plus className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        프로젝트 추가
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 더보기 버튼 */}
            {hasMoreProjects && !isEditMode && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all inline-flex items-center gap-2"
                >
                  <ChevronDown className="h-5 w-5" />
                  더 많은 프로젝트 보기 ({validProjects.length - displayCount}
                  개 더)
                </button>
              </div>
            )}

            {/* 더보기 설정 버튼 (편집 모드) */}
            {isEditMode && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setShowDisplaySettings(true)}
                  className="px-6 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-all inline-flex items-center gap-2"
                >
                  <LayoutGrid className="h-5 w-5" />
                  더보기 설정
                </button>
              </div>
            )}
          </div>
        </section>
      </EditableBackground>

      {/* 이미지 확대 모달 */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative bg-background rounded-lg shadow-2xl max-w-4xl max-h-[85vh] w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-background/80 hover:bg-background shadow-lg transition-all hover:scale-110"
              aria-label="닫기"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>

            <div className="relative w-full h-full flex items-center justify-center p-4">
              {selectedImage &&
              (selectedImage.includes(".mp4") ||
                selectedImage.includes(".webm") ||
                selectedImage.includes("youtube")) ? (
                <video
                  src={selectedImage}
                  className="max-w-full max-h-[75vh] object-contain rounded"
                  controls
                  autoPlay
                  loop
                />
              ) : (
                <img
                  src={selectedImage}
                  alt="확대된 프로젝트 이미지"
                  className="max-w-full max-h-[75vh] object-contain rounded"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* 프로젝트 추가 모달 */}
      {showProjectModal && isEditMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-background border rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">새 프로젝트 추가</h3>
              <button
                onClick={async () => {
                  if (
                    newProject.image &&
                    newProject.image.includes("/uploads/")
                  ) {
                    try {
                      await fetch("/api/delete-image", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ imagePath: newProject.image }),
                      })
                    } catch (error) {
                      console.error("Failed to delete uploaded file:", error)
                    }
                  }
                  setNewProject({
                    image: "",
                    video: "",
                    title: "",
                    description: "",
                    pdfUrl: "",
                  })
                  setShowProjectModal(false)
                }}
                className="p-1 hover:bg-muted rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 이미지/비디오 업로드 */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  프로젝트 이미지/비디오
                </label>
                <div className="h-48 rounded-lg overflow-hidden bg-muted">
                  {newProject.image ? (
                    <div className="relative h-full">
                      {newProject.image.includes(".mp4") ||
                      newProject.image.includes(".webm") ? (
                        <video
                          src={newProject.image}
                          className="w-full h-full object-cover"
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={newProject.image}
                          alt="프로젝트 미리보기"
                          className="w-full h-full object-cover"
                        />
                      )}
                      <button
                        onClick={() =>
                          setNewProject({ ...newProject, image: "" })
                        }
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-2">
                      <input
                        id="project-upload"
                        type="file"
                        accept="image/*,video/mp4,video/webm"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return

                          const isVideo = file.type.includes("video")
                          const maxSize = isVideo
                            ? 20 * 1024 * 1024
                            : 5 * 1024 * 1024

                          if (file.size > maxSize) {
                            alert(
                              `파일 크기는 ${
                                isVideo ? "20MB" : "5MB"
                              } 이하여야 합니다`
                            )
                            return
                          }

                          const formData = new FormData()
                          formData.append("file", file)
                          formData.append("purpose", `project-${Date.now()}`)

                          try {
                            const response = await fetch(
                              isVideo ? "/api/upload-video" : "/api/upload-image",
                              {
                                method: "POST",
                                body: formData,
                              }
                            )

                            const result = await response.json()

                            if (result.success) {
                              setNewProject({
                                ...newProject,
                                image: result.path,
                              })
                            } else {
                              alert(`❌ ${result.error}`)
                            }
                          } catch {
                            alert("업로드 중 오류가 발생했습니다")
                          }
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor="project-upload"
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 cursor-pointer"
                      >
                        <Upload className="h-4 w-4 inline mr-2" />
                        파일 업로드
                      </label>
                      <input
                        type="text"
                        value={newProject.image}
                        onChange={(e) =>
                          setNewProject({ ...newProject, image: e.target.value })
                        }
                        placeholder="또는 URL 입력 (https://...)"
                        className="px-3 py-2 border rounded-lg bg-background text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 프로젝트 제목 */}
              <div>
                <label className="text-sm font-medium mb-1 block">
                  프로젝트 제목
                </label>
                <input
                  type="text"
                  value={newProject.title}
                  onChange={(e) =>
                    setNewProject({ ...newProject, title: e.target.value })
                  }
                  placeholder="예: 브랜드 리뉴얼 프로젝트"
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                />
              </div>

              {/* 프로젝트 설명 */}
              <div>
                <label className="text-sm font-medium mb-1 block">
                  프로젝트 설명
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      description: e.target.value,
                    })
                  }
                  placeholder="예: 스타트업 A사의 전체 브랜딩 리뉴얼 및 UI/UX 개선"
                  className="w-full px-3 py-2 border rounded-lg bg-background resize-none"
                  rows={3}
                />
              </div>

              {/* PDF 링크 입력 */}
              <div>
                <label className="text-sm font-medium mb-1 block">
                  PDF 링크 (선택)
                </label>
                <input
                  type="text"
                  value={newProject.pdfUrl || ""}
                  onChange={(e) =>
                    setNewProject({ ...newProject, pdfUrl: e.target.value })
                  }
                  placeholder="예: /pdfs/acro-vista-report.pdf 또는 https://..."
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  public/pdfs 폴더에 올린 경우 <code>/pdfs/파일이름.pdf</code> 만
                  적어도 됩니다.
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={async () => {
                  if (newProject.title && newProject.description) {
                    const isVideo =
                      newProject.image &&
                      (newProject.image.includes(".mp4") ||
                        newProject.image.includes(".webm"))

                    const projectData: Project = {
                      image: isVideo ? "" : newProject.image,
                      video: isVideo ? newProject.image : "",
                      title: newProject.title,
                      description: newProject.description,
                      pdfUrl: newProject.pdfUrl,
                    }

                    const updatedProjects = [
                      ...projectsInfo.projects,
                      projectData,
                    ]
                    const updatedInfo: ProjectsInfo = {
                      ...projectsInfo,
                      projects: updatedProjects,
                    }

                    setProjectsInfo(updatedInfo)
                    saveData("projects-info", updatedInfo)

                    const success = await saveToFile(
                      "projects",
                      "Info",
                      updatedInfo
                    )
                    if (success) {
                      alert("✅ 프로젝트가 추가되고 파일에 저장되었습니다!")
                    }

                    setNewProject({
                      image: "",
                      video: "",
                      title: "",
                      description: "",
                      pdfUrl: "",
                    })
                    setShowProjectModal(false)
                  } else {
                    alert("제목과 설명을 입력해주세요")
                  }
                }}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                추가
              </button>
              <button
                onClick={async () => {
                  if (
                    newProject.image &&
                    newProject.image.includes("/uploads/")
                  ) {
                    try {
                      await fetch("/api/delete-image", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ imagePath: newProject.image }),
                      })
                    } catch (error) {
                      console.error("Failed to delete uploaded file:", error)
                    }
                  }
                  setNewProject({
                    image: "",
                    video: "",
                    title: "",
                    description: "",
                    pdfUrl: "",
                  })
                  setShowProjectModal(false)
                }}
                className="flex-1 py-2 border rounded-lg hover:bg-muted"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 표시 설정 모달 */}
      {showDisplaySettings && isEditMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-background border rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">더보기 설정</h3>
              <button
                onClick={() => setShowDisplaySettings(false)}
                className="p-1 hover:bg-muted rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* 초기 표시 개수 */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  처음에 보여줄 프로젝트 개수
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 6, 9, 12].map((num) => (
                    <button
                      key={num}
                      onClick={() => {
                        updateProjectsInfo("initialDisplay", num)
                        setDisplayCount(Math.min(displayCount, num))
                      }}
                      className={`py-2 px-3 rounded-lg border transition-all ${
                        projectsInfo.initialDisplay === num
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:bg-muted"
                      }`}
                    >
                      {num}개
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <input
                    type="number"
                    value={projectsInfo.initialDisplay}
                    onChange={(e) => {
                      const value = Math.max(1, parseInt(e.target.value) || 1)
                      updateProjectsInfo("initialDisplay", value)
                      setDisplayCount(Math.min(displayCount, value))
                    }}
                    min={1}
                    max={100}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                    placeholder="직접 입력 (1-100)"
                  />
                </div>
              </div>

              {/* 더보기 클릭 시 추가 개수 */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  더보기 클릭 시 추가로 보여줄 개수
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 6, 9, 12].map((num) => (
                    <button
                      key={num}
                      onClick={() => updateProjectsInfo("loadMoreCount", num)}
                      className={`py-2 px-3 rounded-lg border transition-all ${
                        projectsInfo.loadMoreCount === num
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:bg-muted"
                      }`}
                    >
                      {num}개
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <input
                    type="number"
                    value={projectsInfo.loadMoreCount}
                    onChange={(e) => {
                      const value = Math.max(1, parseInt(e.target.value) || 1)
                      updateProjectsInfo("loadMoreCount", value)
                    }}
                    min={1}
                    max={100}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                    placeholder="직접 입력 (1-100)"
                  />
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground space-y-1">
                <p className="font-medium mb-2">현재 설정:</p>
                <p>• 전체 프로젝트: {validProjects.length}개</p>
                <p>• 처음 표시: {projectsInfo.initialDisplay}개</p>
                <p>• 더보기 클릭당: {projectsInfo.loadMoreCount}개씩 추가</p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  updateProjectsInfo("initialDisplay", 6)
                  updateProjectsInfo("loadMoreCount", 3)
                  setDisplayCount(6)
                }}
                className="flex-1 py-2 border rounded-lg hover:bg-muted"
              >
                기본값으로 초기화
              </button>
              <button
                onClick={async () => {
                  const success = await saveToFile(
                    "projects",
                    "Info",
                    projectsInfo
                  )
                  if (success) {
                    alert("✅ 프로젝트 설정이 파일에 저장되었습니다!")
                  }
                  setShowDisplaySettings(false)
                }}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                📁 저장 & 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
