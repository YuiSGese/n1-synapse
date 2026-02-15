/**
 * SuperMemo 2 Algorithm simplified
 */

export interface SRSData {
  interval: number // Số ngày cho lần ôn tiếp theo
  easeFactor: number // Độ dễ (mặc định 2.5)
  lapses: number // Số lần quên
}

// Giá trị mặc định cho từ mới
export const initialSRSData: SRSData = {
  interval: 0,
  easeFactor: 2.5,
  lapses: 0,
}

/**
 * Tính toán trạng thái mới dựa trên đánh giá
 * @param currentData Trạng thái hiện tại
 * @param grade Điểm đánh giá (0: Again, 3: Hard, 4: Good, 5: Easy) - Quy ước lại cho dễ tính
 * Trong UI ta sẽ dùng: 1: Again, 2: Hard, 3: Good, 4: Easy
 */
export function calculateSRS(currentData: SRSData, grade: 1 | 2 | 3 | 4): SRSData {
  let { interval, easeFactor, lapses } = currentData

  // Mapping grade UI sang grade thuật toán SM-2 (0-5)
  // Again (1) -> 0 (Fail)
  // Hard (2) -> 3 (Pass but hard)
  // Good (3) -> 4 (Pass)
  // Easy (4) -> 5 (Perfect)
  const performanceRating = grade === 1 ? 0 : grade + 1

  if (performanceRating < 3) {
    // Nếu quên (Again)
    interval = 1
    lapses += 1
  } else {
    // Nếu nhớ (Hard/Good/Easy)
    if (interval === 0) {
      interval = 1
    } else if (interval === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * easeFactor)
    }
  }

  // Cập nhật Ease Factor
  // Công thức: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easeFactor = easeFactor + (0.1 - (5 - performanceRating) * (0.08 + (5 - performanceRating) * 0.02))
  
  if (easeFactor < 1.3) easeFactor = 1.3 // EF không được nhỏ hơn 1.3

  return { interval, easeFactor, lapses }
}