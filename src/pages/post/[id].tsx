import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";

import { api } from "~/utils/api";
import { PageLayout } from "~/components/layout";
import { PostView } from "~/components/postview";

const SinglePostPage: NextPage<{ id: string }> = ({ id }) => {
  //getByid gives us all the data given the id of post that we click
  const { data } = api.posts.getById.useQuery({
    id,
  });
  if (!data) return <div>404</div>;
  // we use all that data to find the post and display that post by itself on 
  // its own page
  return (
    <>
      <Head>
        <title>{`${data.post.content} - @${data.author.username}`}</title>
      </Head>
      <PageLayout>
        <div className="flex justify-center">
          <Link href={"/"}>Home </Link>
        </div>
        <PostView {...data} />
      </PageLayout>
    </>
  );
};
import { generateSSGHelper } from "~/server/api/helpers/ssgServerhelper";
import Link from "next/link";
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
