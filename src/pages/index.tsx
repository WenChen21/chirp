import { SignIn, SignInButton, useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import Head from "next/head";
import { api } from "npm/utils/api";
import type { RouterOutputs } from "npm/utils/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from 'next/image';
dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const { user } = useUser();
  console.log(user);
  if (!user) return null;

  return (
    <div className="flex gap-3 w-full">
      <Image
        src={user.profileImageUrl}
        alt="Profile Image"
        className="h-14 w-14 rounded-full"
        width={56}
        height={56}
      />
      <input placeholder="Type some emojis!" className="bg-transparent grow outline-none" />
    </div>)
}
// type PostWithUser = RouterOutputs["posts"]["get"][number];

// const PostView = (props: PostWithUser) => {
//   const { post } = props;
//   return (
//     <div key={post.id} className="flex border-b border-slate-400 p-4 gap-3">
//       <Image
//         src={author.profileImageUrl}
//         className="h-14 w-14 rounded-full"
//         alt={`@${author.username}'s profile picture`}
//         width={56}
//         height={56}
//       />
//       <div className="flex flex-col">
//         <div className="flex text-slate-300">
//           <span> {`@${author.username}`} </span>
//           <span className="font-thin"> {` . ${dayjs(post.createdAt).fromNow()}`}</span>  </div>
//         <span className="text-2xl">{post.content}</span>
//       </div>
//     </div>
//   )
// }
// const Feed = () => {
//   const { data, isLoading: postsLoading } = api.posts.get.useQuery();
//   if (postsLoading) return <LoadingPage />;
//   if (!data) return <div>Something went wrong</div>;

//   return (
//     <div className="flex flex-col">
//       {[...data, ...data]}?.map((post) => {
//         <div key={post.id} className="border-b border-slate-400 p-8">
//           {post.conent}
//         </div>
//       )}
//       {/* {[...data, ...data]?.map((fullPost) => (
//         <PostView {...fullPost} key={fullPost.post.id} />
//       ))} */}
//     </div>
//   )
// }
type PostWithUser = RouterOutputs["posts"]["getAll"][number]
const PostView = (props: PostWithUser) => {
  const { post, author } = props;
  return (
    <div key={post.id} className="flex gap-3 border-b border-slate-400 p-4">
      <Image
        src={author.profileImageUrl}
        className="h-14 w-14 rounded-full"
        alt={`@${author.username}'s profie picture`}
        width={56}
        height={56}
      />
      <div className="flex flex-col">
        <div className="flex text-slate-300">
          <span>{`@${author.username}`}</span>
          <span className="font-thin">{`- ${dayjs(post.createdAt).fromNow()}`}</span>
        </div>
        <span>{post.content}</span>
      </div>

    </div>
  )
}
const Home: NextPage = () => {
  const user = useUser();
  const { data = [], isLoading } = api.posts.getAll.useQuery();
  // const { isLoaded: userLoaded, isSignedIn } = useUser();
  // api.posts.get.useQuery();
  if (isLoading) return <div> Loading </div>;
  if (!data) return <div> Something went wrong</div>;
  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex h-screen justify-center">
        <div className="w-full md:max-w-2xl border-x h-full border-slate-400">
          <div className="flex border-b boarder-slate-400 p-4">
            {!user.isSignedIn &&
              <div className="flex justify-center">
                <SignInButton />
              </div>}
            {user.isSignedIn && <CreatePostWizard />}
          </div>
          {/* <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" /> */}
          <div className="flex flex-col">
            {data.map((fullPost) => (
              <PostView {...fullPost} key={fullPost.post.id} />
            ))}
          </div>
        </div>
        {/* <Feed /> */}
      </main>
    </>
  );
};

export default Home;
