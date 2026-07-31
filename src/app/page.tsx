import Sidebar from "@/components/Sidebar";
import CreatePostPrompt from "@/components/CreatePostPrompt";
import Post from "@/components/Post";
import { pageInfo, posts } from "@/data/mock";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-[#F6ECDF]">
      <Sidebar activeNav="feed" />
      <main className="h-screen min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[760px] px-10 pb-20 pt-[34px]">
          <div className="mb-6">
            <div className="mb-1 text-[12.5px] font-extrabold tracking-wide text-[#D9583C]">
              {pageInfo.daycareName} · {pageInfo.roomName}
            </div>
            <h1 className="m-0 font-fredoka text-[30px] font-semibold text-[#3F362E]">
              Buenas, {pageInfo.teacherName}
            </h1>
            <p className="mt-[5px] text-[14.5px] text-[#94887B]">
              {pageInfo.childCount} niños · {pageInfo.date}
            </p>
          </div>

          <CreatePostPrompt />

          <div className="mb-[14px] flex items-center gap-[14px]">
            <span className="text-[12.5px] font-extrabold tracking-wide text-[#8A7C6D]">
              PUBLICADO HOY
            </span>
            <span className="h-[1px] flex-1 bg-[#E7DAC8]" />
          </div>

          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <Post key={post.id} post={post} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
