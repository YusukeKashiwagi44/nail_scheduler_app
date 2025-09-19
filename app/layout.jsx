export const metadata = {
  title: "Nail Schedule",
  description: "Nail artist's personal schedule manager"
};

import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <div className="topbar">
          <div className="container" style={{padding: "12px 16px"}}>
            <div className="row">
              <div style={{ fontWeight: 700 }}>Nail Schedule</div>
              <div className="space" />
              <a className="ghost" href="/">カレンダー</a>
            </div>
          </div>
        </div>
        <div className="container" style={{paddingTop: 16}}>
          {children}
        </div>
      </body>
    </html>
  );
}

