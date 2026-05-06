import Link from "next/link";

const posts = [
  {
    id: "1",
    title: "Launching our AI-powered analytics dashboard",
    desc: "Real-time analytics tool for SaaS founders. Helps track user behavior without the complexity of traditional tools.",
    author: "Alex Chen",
    credits: 10,
    feedback: 5,
    rating: 4.5,
  },
  {
    id: "2",
    title: "Just hit $10k MRR - here's what worked",
    desc: "Sharing our growth journey and the strategies that helped us reach this milestone.",
    author: "Sarah Miller",
    credits: 10,
    feedback: 12,
    rating: 4.8,
  },
  {
    id: "3",
    title: "New design tool for rapid prototyping",
    desc: "Figma alternative focused on speed and collaboration for remote teams.",
    author: "Mike Ross",
    credits: 10,
    feedback: 8,
    rating: 4.2,
  },
];

export default async function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const name = slug.charAt(0).toUpperCase() + slug.slice(1);

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
        </div>
      </div>

      <div className="container py-8">
        {/* Community Header */}
        <div className="mb-6">
          <Link href="/communities" className="text-sm text-primary-600 hover:underline">
            ← Back to Communities
          </Link>
          <h1 className="mt-2 font-display text-2xl font-bold text-gray-900">
            {name}
          </h1>
          <p className="mt-1 text-gray-600">
            1,240 members · 89 posts
          </p>
        </div>

        {/* Submit Button */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-gray-900">Recent Posts</h2>
          <Link href="/dashboard" className="btn-primary text-sm">
            Submit Project
          </Link>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{post.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{post.desc}</p>
                  <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
                    <span>{post.author}</span>
                    <span>·</span>
                    <span>{post.feedback} feedback</span>
                    <span>·</span>
                    <span>★ {post.rating}</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2 sm:ml-4">
                  <span className="text-xs text-gray-500">Earn +1 credit</span>
                  <button className="btn-primary text-sm px-4 py-2">
                    Visit & Earn
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
