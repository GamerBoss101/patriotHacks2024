import { Link } from "@nextui-org/link";
import { button as buttonStyles } from "@nextui-org/theme";

import { title, subtitle } from "@/components/primitives";

export default function Home() {
    return (
        <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
            <div className="inline-block max-w-xl text-center justify-center">
                <span className={title()}>
                    {"Track Your "}
                </span>
                <span className={title({ color: "green" })}>
                    {"Building's"}
                </span>
                <br />
                <span className={title()}>
                    {"Carbon Footprint"}
                </span>
                <div className={subtitle({ class: "mt-4" })}>
                    Monitor gas, electricity, and waste emissions effortlessly.
                </div>
            </div>

            <div className="flex gap-3">
                <Link
                    className={buttonStyles({
                        color: "primary",
                        radius: "full",
                        variant: "shadow",
                    })}
                    href="/buildings"
                >
                    Get Started
                </Link>
            </div>

            <div className="mt-8 flex gap-4">
                <div className="text-center">
                    <h3 className="text-lg font-semibold">Gas</h3>
                    <p>Track natural gas usage</p>
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-semibold">Electricity</h3>
                    <p>Monitor power consumption</p>
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-semibold">Waste</h3>
                    <p>Manage waste emissions</p>
                </div>
            </div>
        </section>
    );
}
