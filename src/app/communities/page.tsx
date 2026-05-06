import Link from "next/link";

const communities = [
  { name: "SaaS", slug: "saas", members: 1240, posts: 89 },
  { name: "Startups", slug: "startups", members: 980, posts: 67 },
  { name: "Marketing", slug: "marketing", members: 856, posts: 54 },
  { name: "Design", slug: "design", members: 732, posts: 43 },
  { name: "YouTube", slug: "youtube", members: 645, posts: 38 },
];

export default function Communities() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary-600">
              <span className="text-sm font-bold text-white">Z</span>
            </div>
            <span className="font-display text-lg font-bold">ZRise</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-gray-900">
              Dashboard
            </Link>
            <Link href="/communities" className="text-sm font-medium text-primary-600 border-b-2 border-primary-600 pb-1">
              Communities
            </Link>
          </nav>
        </div>
      </div>

      <div className="container py-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">Communities</h1>
        <p className="mt-1 text-gray-600">Browse projects by category and start earning credits.</p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {communities.map((c) => (
            <Link
              key={c.slug}
              href={`/communities/${c.slug}`}
              className="rounded-lg border border-gray-200 bg-white p-5 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-gray-900">
                  {c.name}
                </h2>
                <span className="text-xs text-gray-400">{c.posts} posts</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {c.members.toLocaleString()} members
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
