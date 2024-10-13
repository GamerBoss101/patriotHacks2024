'use client';

import { Link } from "@nextui-org/link";
import { button as buttonStyles } from "@nextui-org/theme";
import { useTheme } from "next-themes";

import { title, subtitle } from "@/components/primitives";
import FeatureBox from "@/app/featureBox";

export default function Home() {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col">
      <section className="flex-grow flex flex-col items-center justify-center gap-4 py-8 md:py-10 overflow-hidden relative">
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="object-cover w-full h-full"
          >
            <source src="/homepage-video.mp4" type="video/mp4" />
            <a href="https://www.vecteezy.com/free-videos/city-time-lapse-at-night">City Time Lapse At Night Stock Videos by Vecteezy</a>
          </video>
          <div className="absolute inset-0 bg-orange-900 opacity-60" />
        </div>
        <div className="relative z-10 text-left w-full max-w-4xl px-6">
          <div className="mb-4">
            <span className={title({ class: "text-white" })}>
              Your platform for{" "}
            </span>
            <span className={title({ color: "yellow" })}>
              building
            </span>
            <br />
            <span className={title({ class: "text-white" })}>
              a sustainable future
            </span>
          </div>

          <div className={subtitle({ class: "mt-4 text-gray-200" })}>
            Encourage <span className="text-orange-400">student participation</span> in responsible waste management with smart bins that guide proper disposal.
          </div>

          <div className="mt-8">
            <Link
              className={buttonStyles({
                color: "warning",
                radius: "full",
                variant: "shadow",
                size: "lg",
              })}
              href="/buildings"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      <div className="w-full bg-white dark:bg-gray-900 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureBox
              title="Smart Bins with Real-time Feedback"
              description="Our AI-powered smart bins guide students on proper waste disposal and provide immediate feedback through interactive faces."
              theme={theme}
            />
            <FeatureBox
              title="Track Waste and Emissions"
              description="Log your building's trash and monitor emissions over time, giving you insights into your waste management efficiency."
              theme={theme}
            />
            <FeatureBox
              title="Measure Your Impact"
              description="Track your building's emissions reduction and see the emissions saved through our smart bin system."
              theme={theme}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
