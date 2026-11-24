import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// 목업 LLM 모드로 실행된다 (playwright.config.ts의 webServer.env).

test.describe('브리핑 렌더', () => {
  test('기본 시나리오가 렌더되고 렌더 에러가 없다', async ({ page }, info) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text())
    })

    await page.goto('/')
    const slot = page.getByTestId('briefing-slot')
    await expect(slot.locator('.genui-card').first()).toBeVisible()

    if (info.project.name === 'mo') {
      // mo 기본은 이동 중 요약: 카드 1장, AI 초안 라벨 고정
      await expect(slot.locator('.genui-card')).toHaveCount(1)
      await expect(slot.getByText('AI 초안 · 약관 확인 필요')).toBeVisible()
      await expect(page.locator('#intent')).toBeHidden()
    }
    else {
      // pc 기본은 아침 브리핑: 섹션 2개, 알림 카드 3장 + 일정 1장
      await expect(slot.locator('.briefing-section')).toHaveCount(2)
      await expect(slot.locator('.genui-card')).toHaveCount(4)
      // 고객명은 AI 출력이 아니라 목업 DB에서 읽힌다
      await expect(slot.locator('.genui-card__title', { hasText: '박서준' })).toBeVisible()
      await expect(page.locator('#intent')).toBeVisible()
    }

    // 모든 카드에 근거 노출
    const cards = await slot.locator('.genui-card').count()
    await expect(slot.locator('.genui-card__reason')).toHaveCount(cards)
    expect(errors).toEqual([])
  })

  test('상담 준비 시나리오: AI 텍스트 카드에 라벨 고정', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: '김현수 · 상담 준비' }).click()
    const talk = page.locator('.genui-card', { hasText: '갱신형 vs 비갱신형' })
    await expect(talk).toBeVisible()
    await expect(talk.getByText('AI 초안 · 약관 확인 필요')).toBeVisible()
  })

  test('mo에서 상한(3장)을 넘는 아침 브리핑은 접히고 더보기로 펼쳐진다', async ({ page }, info) => {
    test.skip(info.project.name !== 'mo', 'mo 전용')
    await page.goto('/')
    await page.getByRole('button', { name: '정미경 · 아침 브리핑' }).click()
    const slot = page.getByTestId('briefing-slot')
    await expect(page.getByTestId('show-more')).toHaveText('카드 1장 더보기')
    await expect(slot.locator('.genui-card')).toHaveCount(3)
    await page.getByTestId('show-more').click()
    await expect(slot.locator('.genui-card')).toHaveCount(4)
  })

  test('일정 카드에는 현재 FC의 일정만 나온다', async ({ page }, info) => {
    test.skip(info.project.name !== 'pc', 'pc 전용')
    await page.goto('/')
    const timeline = page.locator('.timeline')
    await expect(timeline.locator('.timeline__item')).toHaveCount(2)
    await expect(timeline).not.toContainText('오세훈') // 김현수 FC 담당 고객
  })

  test('카드 액션이 동작한다', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: '정미경 · 아침 브리핑' }).click()
    await page.getByRole('button', { name: '전화 걸기' }).first().click()
    await expect(page.getByText('박서준 고객에게 전화 연결 (목업)')).toBeVisible()
  })
})

test.describe('접근성 (axe-core)', () => {
  for (const label of ['정미경 · 아침 브리핑', '김현수 · 상담 준비', '정미경 · 이동 중']) {
    test(`${label}: 위반 없음`, async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: label }).click()
      await expect(page.getByTestId('briefing-slot').locator('.genui-card').first()).toBeVisible()
      const results = await new AxeBuilder({ page }).analyze()
      expect(results.violations.map(v => `${v.id}: ${v.help}`)).toEqual([])
    })
  }
})
