// pages/index.js
import { getSession } from "next-auth/react";
import DashboardClient from "./DashboardClient";

export default function Dashboard({ user }) {
  return (
    <div>
      <DashboardClient user={user} />
    </div>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/auth/signin",
        permanent: false,
      },
    };
  }

  return {
    props: {
      user: session.user,
    },
  };
}
