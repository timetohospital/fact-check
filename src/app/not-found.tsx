import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <h1
        style={{
          fontSize: "6rem",
          fontWeight: 700,
          color: "var(--primary)",
          marginBottom: "1rem",
        }}
      >
        404
      </h1>
      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: 600,
          color: "var(--foreground)",
          marginBottom: "1rem",
        }}
      >
        페이지를 찾을 수 없습니다
      </h2>
      <p
        style={{
          fontSize: "1rem",
          color: "var(--muted)",
          marginBottom: "2rem",
          maxWidth: "400px",
        }}
      >
        요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
      </p>
      <Link
        href="/"
        style={{
          padding: "0.75rem 1.5rem",
          backgroundColor: "var(--primary)",
          color: "white",
          borderRadius: "8px",
          textDecoration: "none",
          fontWeight: 500,
          transition: "opacity 0.2s",
        }}
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
