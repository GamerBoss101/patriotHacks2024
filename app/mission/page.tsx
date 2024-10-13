'use client'

import Image from 'next/image';
import { Button } from "@nextui-org/react";
import Link from "next/link";
export default function MissionPage() {
    return (
        <div className="relative min-h-screen bg-orange-900/5">
            {/* Large "About Us" text at the top */}
            <div className="absolute top-0 left-0 right-0 z-10 flex justify-center items-center h-40">
                <h1 className="text-6xl font-bold bg-gradient-to-r from-[#FF705B] to-[#FFB457] text-transparent bg-clip-text drop-shadow-lg">Our Mission</h1>
            </div>

            <div className="relative min-h-screen">
                <Image
                    src="/demo.png"
                    alt="Demo image"
                    width={1920}
                    height={3000}
                    className="w-full h-auto"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent h-80 dark:from-background dark:via-background">
                    {/* text at the bottom */}
                    <div className="flex flex-col self-end items-center pb-16">
                        <p className="mt-40 text-lg text-center max-w-2xl">
                            One of the most neglected aspects of a building&apos;s carbon footprint is waste mismanagement and poor recycling practices. According to the EPA, landfills account for <span className="bg-gradient-to-r from-[#FF705B] to-[#FFB457] text-transparent bg-clip-text">15% of U.S. methane emissions</span>, with commercial buildings generating over <span className="bg-gradient-to-r from-[#FF705B] to-[#FFB457] text-transparent bg-clip-text">30% of the nation&apos;s total waste</span>.
                            <br />
                            <br />
                            Studies show that up to <span className="bg-gradient-to-r from-[#FF705B] to-[#FFB457] text-transparent bg-clip-text">25% of items</span> in recycling bins are actually non-recyclable, contaminating entire loads. Only 32% of commercial waste is recycled, compared to a potential 75% that could be. Proper recycling can reduce a building&apos;s carbon emissions <span className="bg-gradient-to-r from-[#FF705B] to-[#FFB457] text-transparent bg-clip-text">by up to 40%</span>.
                            <br />
                            <br />
                            <strong>Carbin</strong> uses a machine learning algorithm to identify the type of waste at the trash chute, nudging the occupants to recycle correctly with a friendly reminder. Our long term goal is to <span className="bg-gradient-to-r from-[#FF705B] to-[#FFB457] text-transparent bg-clip-text">educate building occupants</span>, something we know will truly revolutionize waste management, make efficient sorting and recycling the norm, and significantly curtail the carbon impact of our daily operations.
                        </p>
                        <Button
                            as={Link}
                            href="/buildings"
                            variant="solid"
                            size="lg"
                            endContent={
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            }
                            className="mb-2 mt-6 bg-orange-500 text-white"
                        >
                            Intrigued? Explore participating buildings
                        </Button>
                    </div>
                </div>
            </div>
        </div >
    );
}
