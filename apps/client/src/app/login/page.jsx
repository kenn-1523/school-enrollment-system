export default function LoginRedirectPage() {
  return (
    <html>
      <head>
        <meta httpEquiv="refresh" content="0; url=/student/login" />
        <script
          dangerouslySetInnerHTML={{
            __html: "window.location.replace('/student/login');",
          }}
        />
      </head>
      <body />
    </html>
  );
}