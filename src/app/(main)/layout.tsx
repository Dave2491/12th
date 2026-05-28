import { AppNav } from "@/components/layout/AppNav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen"
      style={{
        background: "#080808",
        backgroundImage: `
          radial-gradient(ellipse at 0% 0%, rgba(255,255,255,0.03) 0%, transparent 50%),
          radial-gradient(ellipse at 100% 100%, rgba(255,255,255,0.02) 0%, transparent 50%),
          radial-gradient(ellipse at 100% 0%, rgba(255,255,255,0.02) 0%, transparent 40%)
        `,
        backgroundAttachment: "fixed",
      }}
    >
      {/* X Layer watermark */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 0,
          opacity: 0.015,
          filter: "grayscale(100%)",
        }}
      >
        <img
          src="/images/xlayer-logo.svg"
          alt=""
          style={{ width: "30vw", maxWidth: "300px" }}
        />
      </div>

<AppNav />
      <main className="relative md:ml-[240px] pt-[48px] md:pt-0 pb-[64px] md:pb-0" style={{ position: "relative", zIndex: 1 }}>
        <div className="max-w-[900px] mx-auto px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
