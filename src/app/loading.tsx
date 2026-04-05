export default function Loading() {
  return (
    <main>
      {/* Search form skeleton */}
      <div className="search-card-wrapper">
      <div className="search-card-inner bg-card-bg border border-[var(--dark-gray-color)] rounded-md px-4 py-3">
        <div className="flex gap-2 mb-3">
          {['すべて', '全学教育科目', '専門科目(2年次以降)'].map(label => (
            <button
              key={label}
              disabled
              className="py-1.5 px-3.5 border text-[13px] rounded-md bg-transparent text-dark-gray border-border"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2.5 items-center max-md:flex-wrap max-md:justify-end">
          <input type="text" placeholder="講義名" disabled className="text-base h-[30px] py-0.5 px-[5px] border border-dark-gray flex-1 max-md:w-full max-md:flex-none" />
          <input type="text" placeholder="教員名" disabled className="text-base h-[30px] py-0.5 px-[5px] border border-dark-gray flex-1 max-md:w-full max-md:flex-none" />
          <button disabled className="h-8 w-20 text-sm shrink-0 inline-flex items-center justify-center rounded-sm border border-[var(--accent-border)] bg-accent text-btn-text-on-accent opacity-50">検索</button>
          <button disabled className="h-8 w-20 text-[13px] shrink-0 inline-flex items-center justify-center rounded-sm border border-border bg-transparent text-dark-gray opacity-50">リセット</button>
        </div>
      </div>
      </div>

      {/* Post list skeleton */}
      <div className="grid grid-cols-1 gap-2 mt-3">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="post-card animate-pulse" style={{ minHeight: 56 }}>
            <div className="flex justify-between items-center w-full pb-0.5">
              <div className="flex items-center gap-[15px] flex-1 min-w-0">
                <div className="h-5 w-32 bg-light-gray rounded" />
                <div className="h-4 w-20 bg-light-gray rounded" />
              </div>
              <div className="h-8 w-10 bg-light-gray rounded" />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
