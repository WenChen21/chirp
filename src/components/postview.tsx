
import type { RouterOutputs } from "npm/utils/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from 'next/image';
import Link from "next/link";
dayjs.extend(relativeTime);
type PostWithUser = RouterOutputs["posts"]["getAll"][number]
export const PostView = (props: PostWithUser) => {
  const { post, author } = props;
  console.log(typeof (post.createdAt))
  return (
    <div key={post.id} className="flex gap-3 border-b border-slate-400 p-4">
      <Image
        src={author.profileImageUrl}
        className="h-14 w-14 rounded-full"
        alt={`@${author.username}'s profie picture`}
        width={56}
        height={56}
        priority={false}
      />
      <div className="flex flex-col">
        <div className="flex text-slate-300">
          <Link href={`/@${author.username}`}>
            <span>{`@${author.username}`}</span>
          </Link>
          <Link href={`/post/${post.id}`}>
            <span className="font-thin">{`- ${dayjs(post.createdAt).fromNow()}`}</span>
          </Link>
        </div>
        <span className="text-2xl">{post.content}</span>
      </div>

    </div>
  )
}