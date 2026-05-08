import type { NextPageContext } from "next";

interface Props {
  statusCode: number;
}

function Error({ statusCode }: Props) {
  return (
    <p style={{ textAlign: "center", padding: "2rem" }}>
      {statusCode} — 오류가 발생했어요
    </p>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? (err as NodeJS.ErrnoException & { statusCode?: number }).statusCode ?? 500 : 404;
  return { statusCode };
};

export default Error;
