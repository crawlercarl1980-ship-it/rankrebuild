export type Plan = 'none' | 'trial' | 'basic' | 'pro'

export interface PlanLimits {
  maxSites: number
  maxBlogPostsPerMonth: number
  canUseDemoSite: boolean
}

export function getPlanLimits(plan: Plan): PlanLimits {
  switch (plan) {
    case 'pro':
      return { maxSites: 3, maxBlogPostsPerMonth: Infinity, canUseDemoSite: true }
    case 'basic':
      return { maxSites: 1, maxBlogPostsPerMonth: 4, canUseDemoSite: true }
    case 'trial':
      return { maxSites: 1, maxBlogPostsPerMonth: 2, canUseDemoSite: true }
    default:
      return { maxSites: 1, maxBlogPostsPerMonth: 0, canUseDemoSite: true }
  }
}

export function getEffectivePlan(subscription: { plan: string; status: string } | null): Plan {
  if (!subscription) return 'none'
  if (subscription.status === 'canceled' || subscription.status === 'past_due') return 'none'
  if (subscription.status === 'trialing') return 'trial'
  return subscription.plan as Plan
}
