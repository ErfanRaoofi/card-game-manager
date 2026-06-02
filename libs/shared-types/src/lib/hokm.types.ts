import { TeamId } from './room.types';

/** نوع ثبت نتیجهٔ یک دست */
export type HandPointType = 'NORMAL' | 'KET';

/** خال‌های معمولی حکم */
export const HOKM_SUIT_CHOICES = ['پیک', 'دل', 'خشت', 'گشنیز'] as const;

/** انواع ویژهٔ حکم (بدون امتیاز جدا — فقط نوع حکم) */
export const HOKM_SPECIAL_CHOICES = ['نرس', 'سرس', 'تک نرس'] as const;

export type HokmChoice = (typeof HOKM_SUIT_CHOICES)[number] | (typeof HOKM_SPECIAL_CHOICES)[number];

export const HOKM_ALL_CHOICES: readonly string[] = [...HOKM_SUIT_CHOICES, ...HOKM_SPECIAL_CHOICES];

export const HOKM_SCORING = {
  /** برد دست عادی (هر تیم) */
  NORMAL_HAND: 1,
  /** کت تیم حاکم */
  HAKEM_TEAM_KET: 2,
  /** کت تیم حریف */
  OPPONENT_KET: 3,
  HANDS_TO_WIN_SET: 7,
} as const;

/** امتیاز دست بر اساس تیم حاکم و نوع نتیجه */
export function getHokmHandPoints(
  pointType: HandPointType,
  scoringTeamId: TeamId,
  hakemTeamId: TeamId,
): number {
  if (pointType === 'NORMAL') {
    return HOKM_SCORING.NORMAL_HAND;
  }
  return scoringTeamId === hakemTeamId
    ? HOKM_SCORING.HAKEM_TEAM_KET
    : HOKM_SCORING.OPPONENT_KET;
}

export interface RecordHandPayload {
  roomId: string;
  pointType: HandPointType;
  /** تیم برندهٔ دست عادی */
  teamId?: TeamId;
  /** بازیکن کت‌کننده */
  playerId?: string;
}
