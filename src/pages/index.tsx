import { SignInButton, useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import { api } from "npm/utils/api";

import Image from 'next/image';
import { LoadingPage, LoadingSpinner } from "npm/components/loading";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { PageLayout } from "npm/components/layout";
import { PostView } from "npm/components/postview";


const CreatePostWizard = () => {
  const { user } = useUser();
  const [input, setInput] = useState("");
  console.log(user);
  const ctx = api.useContext();
  const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    onSuccess: () => {
      setInput("");
      void ctx.posts.getAll.invalidate();
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;
      if (errorMessage && errorMessage[0]) {
        toast.error(errorMessage[0]);
      }
      else {
        toast.error("Failed to post! Try again!");
      }

    },
  });
  if (!user) return null;

  return (
    <div className="flex gap-3 w-full">
      <Image
        src={user.profileImageUrl}
        alt="Profile Image"
        className="h-14 w-14 rounded-full"
        width={56}
        height={56}
        priority={false}
      />
      <input
        placeholder="Type some emojis!"
        className="bg-transparent grow outline-none"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (input !== "") {
              mutate({ content: input });
            }
          }
        }}
        disabled={isPosting} />
      {input !== "" && !isPosting && (<button onClick={() => mutate({ content: input })} disabled={isPosting}>Post</button>)}
      {isPosting && <div className="flex flex-col justify-center items-center"><LoadingSpinner size={20} /></div>}

    </div>)


}
const Feed = () => {
  const { data = [], isLoading: postsLoading } = api.posts.getAll.useQuery();
  if (postsLoading) return <LoadingPage />
  if (!data) return <div> Something went wrong</div>
  return (<div className="flex flex-col">
    {data.map((fullPost) => (
      <PostView {...fullPost} key={fullPost.post.id} />
    ))}
  </div>)
}
const Home: NextPage = () => {
  const { isLoaded: userLoaded, isSignedIn } = useUser();
  api.posts.getAll.useQuery();
  if (!userLoaded) return <div />;

  return (
    < PageLayout >
      <div className="flex border-b border-slate-400 p-4">
        {!isSignedIn && (
          <div className="flex justify-center">
            <SignInButton />
          </div>
        )}
        {isSignedIn && <CreatePostWizard />}
      </div>
      <Feed />
    </PageLayout >
  );
};

export default Home;
