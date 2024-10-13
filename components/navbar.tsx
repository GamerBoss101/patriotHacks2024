// components/navbar.tsx
"use client";

import {
    Navbar as NextUINavbar,
    NavbarContent,
    NavbarBrand,
    NavbarItem,
} from "@nextui-org/navbar";
import { Button } from "@nextui-org/button";
import { Link } from "@nextui-org/link";
import NextLink from "next/link";
import { usePathname } from 'next/navigation';
import Image from "next/image";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { GithubIcon } from "@/components/icons";

export const Navbar = () => {
    const pathname = usePathname();

    if (pathname.includes("/buildings/")) {
        return <></>;
    }

    return (
        <NextUINavbar maxWidth="xl" position="sticky">
            <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
                <NavbarBrand as="li" className="gap-3">
                    <NextLink className="flex justify-start items-center" href="/">
                        <Image
                            alt="Carbin Logo"
                            className="h-8 w-8"
                            height={48}
                            src="/carbin.png"
                            width={48}
                        />

                        <p className="text-2xl font-bold font-baskerville">Carbin</p>
                    </NextLink>
                </NavbarBrand>
            </NavbarContent>

            <NavbarContent className="hidden sm:flex basis-1/5 sm:basis-full" justify="center">
                <NavbarItem>
                    <Button
                        as={NextLink}
                        href="/buildings"
                        className="bg-orange-500 text-white min-w-[120px]"
                    >
                        Buildings
                    </Button>
                </NavbarItem>
                <NavbarItem>
                    <Button
                        as={NextLink}
                        href="/mission"
                        className="text-orange-500 min-w-[120px]"
                        variant="ghost"
                    >
                        Our Mission
                    </Button>
                </NavbarItem>
            </NavbarContent>

            <NavbarContent
                className="hidden sm:flex basis-1/5 sm:basis-full"
                justify="end"
            >
                <NavbarItem className="hidden sm:flex gap-2">
                    <Link isExternal aria-label="Github" href={siteConfig.links.github}>
                        <GithubIcon className="text-default-500" />
                    </Link>
                    <ThemeSwitch />
                </NavbarItem>
            </NavbarContent>
        </NextUINavbar>
    );
};
