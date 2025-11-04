// 공통 스타일 상수
export const COMMON_STYLES = {
  // 삭제 버튼 (X) 스타일 - 모든 섹션에서 통일
  deleteButton: "absolute -top-1 -right-1 p-0.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 z-10 flex items-center justify-center",
  deleteIcon: "h-3 w-3",
  
  // 추가 버튼 스타일
  addButton: "border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center",
  addIcon: "h-8 w-8 text-muted-foreground mb-2",
  
  // 카드 스타일
  card: "border-0 shadow-lg hover:shadow-xl transition-all duration-300 relative",
}