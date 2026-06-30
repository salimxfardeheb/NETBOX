/**
 * Fixed, non-interactive backdrop sitting behind all content.
 * The blurred blue "orbs" are what give the glass surfaces their
 * refraction — without colour behind them, frosted glass looks grey.
 *
 * Rendered once in the root layout; never moves, never scrolls.
 */
export function Background() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      {/* Top-left orb */}
      <div
        className="absolute rounded-full"
        style={{
          top: "-10%",
          left: "-5%",
          width: "45vw",
          height: "45vw",
          background:
            "radial-gradient(circle at center, #3b82f6 0%, transparent 70%)",
          filter: "blur(120px)",
          opacity: 0.4,
        }}
      />

      {/* Bottom-right orb */}
      <div
        className="absolute rounded-full"
        style={{
          bottom: "-15%",
          right: "-10%",
          width: "50vw",
          height: "50vw",
          background:
            "radial-gradient(circle at center, #1e40af 0%, transparent 70%)",
          filter: "blur(120px)",
          opacity: 0.4,
        }}
      />

      {/* Centre accent orb — adds depth between the two corners. */}
      <div
        className="absolute rounded-full"
        style={{
          top: "40%",
          left: "55%",
          width: "30vw",
          height: "30vw",
          background:
            "radial-gradient(circle at center, #3b82f6 0%, transparent 70%)",
          filter: "blur(120px)",
          opacity: 0.25,
        }}
      />
    </div>
  );
}
