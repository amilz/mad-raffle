import Link from 'next/link';
import Image from 'next/image';
import { cn } from '../../utils';
import { useRouter } from 'next/router';
import { useRef } from 'react';

type NavImageProps = {
    imageSrc: string;   // Added a new prop for the image source
    activeSrc: string;
    href: string;
    as?: string;
    scroll?: boolean;
    chipLabel?: string;
    disabled?: boolean;
    label: string;
    navigationStarts?: () => void;
};

const NavImage = ({
    imageSrc,    // Unpack the new prop
    activeSrc,
    href,
    as,
    scroll,
    disabled,
    label,
    navigationStarts = () => {},
}: NavImageProps) => {
    const router = useRouter();
    const isActive = href === router.asPath || (as && as === router.asPath);
    const divRef = useRef<HTMLDivElement | null>(null);

    return (
        <Link
            href={href}
            as={as}
            scroll={scroll}
            passHref
            className={cn(
                'group flex h-full flex-col items-center justify-between',
                disabled &&
                    'pointer-events-none cursor-not-allowed opacity-50',
            )}
            onClick={() => navigationStarts()}
        >
            <div className="flex flex-row items-center gap-3">
                <Image src={isActive ? activeSrc : imageSrc} alt={label} width={25} height={25}/>
            </div>
            <div ref={divRef} />
        </Link>
    );
};

export default NavImage;
