'use client'

export default function BillingPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="sg-page-title">Billing</h1>
        <p className="sg-page-subtitle">Manage organisation plans and subscriptions</p>
      </div>

      <div className="sg-card p-8 flex flex-col items-center gap-4 text-center">
        <span className="text-5xl">💳</span>
        <h2 className="text-lg font-semibold text-gray-800">Billing management</h2>
        <p className="text-sm text-gray-500 max-w-md">
          Billing integration (Stripe) is configured in Phase 2.
          For now, plan upgrades are handled manually by the platform admin.
        </p>
        <div className="grid grid-cols-3 gap-4 mt-4 w-full max-w-lg">
          {[
            { plan: 'Free', price: '$0/mo', features: ['1 org', '5 users', '90-day logs'] },
            { plan: 'Pro', price: '$49/mo', features: ['1 org', '50 users', '1-year logs'] },
            { plan: 'Enterprise', price: 'Custom', features: ['Unlimited orgs', 'Unlimited users', 'Custom retention'] },
          ].map((tier) => (
            <div key={tier.plan} className="sg-card p-4 text-left">
              <p className="font-bold text-gray-800">{tier.plan}</p>
              <p className="text-lg font-semibold text-blue-600 mt-0.5">{tier.price}</p>
              <ul className="mt-3 space-y-1">
                {tier.features.map((f) => (
                  <li key={f} className="text-xs text-gray-500 flex items-center gap-1.5">
                    <span className="text-green-500">✓</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
