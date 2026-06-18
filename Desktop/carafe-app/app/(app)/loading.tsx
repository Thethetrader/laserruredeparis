export default function Loading() {
  return (
    <div className="flex items-center justify-center animate-pulse" style={{ minHeight: "60vh" }}>
      <img
        src="/icon-192.png"
        alt="Karaf"
        width={72}
        height={72}
        style={{ objectFit: "cover", borderRadius: 18 }}
      />
    </div>
  );
}
