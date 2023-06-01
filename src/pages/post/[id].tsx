import type { GetStaticProps, InferGetStaticPropsType, NextPage } from "next";
import Head from "next/head";

import { api } from "npm/utils/api";
import { PageLayout } from "npm/components/layout";
import { LoadingPage } from "npm/components/loading";
import { PostView } from "npm/components/postview";
const ProfileFeed = (props: { userId: string }) => {
  const { data, isLoading } = api.posts.getPosts.useQuery({ userId: props.userId })
  if (isLoading) return <LoadingPage />;
  if (!data || data.length === 0) return <div>User has not posted</div>;
  return <div className="flex flex-col">
    {data.map((fullPost) => <PostView {...fullPost} key={fullPost.post.id} />)}
  </div>

}
type PageProps = InferGetStaticPropsType<typeof getStaticProps>
const SinglePostPage: NextPage<{ id: string }> = ({ id }) => {
  const { data } = api.posts.getById.useQuery({
    id,
  });
  if (!data) return <div>404</div>;

  return (
    <>
      <Head>
        <title>{`${data.post.content} - @${data.author.username}`}</title>
      </Head>
      <PageLayout>
        <PostView {...data} />
      </PageLayout>
    </>
  );
};
import { generateSSGHelper } from "npm/server/api/helpers/ssgServerhelper";
export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = generateSSGHelper();

  const id = context.params?.id;
  if (typeof id !== "string") throw new Error("no id!");


  await ssg.posts.getById.prefetch({ id });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      id,
    },
  };
};

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" }
};
// data is there when the page loads so isLoading will never be hit or triggered


export default SinglePostPage;
