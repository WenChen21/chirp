import type { GetStaticProps, InferGetStaticPropsType, NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { api } from "npm/utils/api";
const ProfileFeed = (props: { userId: string }) => {
  const { data, isLoading } = api.posts.getPosts.useQuery({ userId: props.userId })
  if (isLoading) return <LoadingPage />;
  if (!data || data.length === 0) return <div>User has not posted</div>;
  return <div className="flex flex-col">
    {data.map((fullPost) => <PostView {...fullPost} key={fullPost.post.id} />)}
  </div>

}
type PageProps = InferGetStaticPropsType<typeof getStaticProps>
const ProfilePage: NextPage<PageProps> = ({ username }) => {
  const { data } = api.profile.getUserbyUsername.useQuery({
    username,
  })
  if (!data) return <div>404</div>;

  return (
    <>
      <Head>
        <title>{data.username}</title>
      </Head>
      <PageLayout>
        <div className="relative h-48 border-slate-400 bg-slate-600">
          <Image
            src={data.profileImageUrl}
            alt={`@{data.username?? ""}'s profile pic`}
            width={128}
            height={128}
            className="absolute bottom-0 left-0 -mb-[56px] ml-8 rounded-full border-4 border-black bg-black" />
        </div>
        <div className="h-[40px]"></div>
        <div className="p-4 text-2xl ml-4">{`@${data.username ?? ""}`}</div>
        <div className="w-full border-b border-slate-400" />
        <ProfileFeed userId={data.id} />
      </PageLayout>
    </>
  );
};
import { appRouter } from "npm/server/api/root";
// import { createProxySSGHelpers } from '@trpc/react-query/ssg';
import { prisma } from "npm/server/db";
import superjson from "superjson";
import { createServerSideHelpers } from '@trpc/react-query/server';
import { PageLayout } from "npm/components/layout";
import { LoadingPage } from "npm/components/loading";
import { PostView } from "npm/components/postview";

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = createServerSideHelpers({
    router: appRouter,
    ctx: { prisma, userId: null },
    transformer: superjson,
  });

  const slug = context.params?.slug;
  if (typeof slug !== "string") throw new Error("no slug!");

  const username = slug.replace("@", "");
  await ssg.profile.getUserbyUsername.prefetch({ username });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      username,
    },
  };
};

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" }
};
// data is there when the page loads so isLoading will never be hit or triggered


export default ProfilePage;
