import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us - Flippress",
  description:
    "Learn about Flippress and our mission to transform digital publishing.",
};

export default function AboutUs() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">About Flippress</h1>
        <p className="text-muted-foreground">
          Empowering creators to turn content into beautiful, interactive digital
          experiences.
        </p>
      </div>

      {/* Story */}
      <section className="mb-12 space-y-4">
        <h2 className="text-2xl font-semibold">Our Story</h2>
        <p className="text-muted-foreground">
          Founded in 2025, Flippress was created to make digital publishing
          simple, and accessible.
        </p>
        <p className="text-muted-foreground">
          We noticed creators struggling with limited platforms and pricing.
          Flippress bridges that gap by combining ease of use with professional
          quality.
        </p>
      </section>

      {/* Mission */}
      <section className="mb-12 space-y-4">
        <h2 className="text-2xl font-semibold">Our Mission</h2>
        <p className="text-muted-foreground">
          To help creators publish stunning content that captivates their
          audience — without technical barriers.
        </p>
      </section>
    </div>
  );
}
