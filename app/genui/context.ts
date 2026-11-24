import type { InjectionKey, Ref } from 'vue'
import type { FcId } from '../../data/mock'

/**
 * 현재 로그인한 FC. AI 출력이 아니라 페이지(세션)가 정하는 값이다.
 * 컴포넌트는 이 값으로 담당 범위를 제한해 다른 FC의 데이터가 섞이지 않게 한다.
 */
export const CURRENT_FC: InjectionKey<Ref<FcId>> = Symbol('current-fc')
